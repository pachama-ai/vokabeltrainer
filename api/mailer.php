<?php
// ============================================================
// mailer.php — einfacher SMTP-Mailversand ohne externe Libs
// ============================================================

require_once __DIR__ . '/db.php';

function smtpServerRead($socket): string {
    $response = '';
    while (!feof($socket)) {
        $line = fgets($socket, 515);
        if ($line === false) {
            break;
        }
        $response .= $line;
        // SMTP multiline replies end with "<code><space>"
        if (preg_match('/^\d{3} /', $line) === 1) {
            break;
        }
    }
    return $response;
}

function smtpExpect($socket, array $okCodes): string {
    $response = smtpServerRead($socket);
    $code = (int) substr($response, 0, 3);
    if (!in_array($code, $okCodes, true)) {
        throw new RuntimeException('SMTP error: ' . trim($response));
    }
    return $response;
}

function smtpWrite($socket, string $command): void {
    $written = fwrite($socket, $command . "\r\n");
    if ($written === false) {
        throw new RuntimeException('SMTP write failed');
    }
}

function buildMimeMessage(string $fromAddress, string $fromName, string $toAddress, string $subject, string $textBody, string $htmlBody): string {
    $boundary = 'b1_' . bin2hex(random_bytes(12));
    $safeFromName = function_exists('mb_encode_mimeheader')
        ? mb_encode_mimeheader($fromName, 'UTF-8')
        : '=?UTF-8?B?' . base64_encode($fromName) . '?=';
    $safeSubject = function_exists('mb_encode_mimeheader')
        ? mb_encode_mimeheader($subject, 'UTF-8')
        : '=?UTF-8?B?' . base64_encode($subject) . '?=';

    $headers = [
        'From: ' . $safeFromName . ' <' . $fromAddress . '>',
        'To: <' . $toAddress . '>',
        'Subject: ' . $safeSubject,
        'MIME-Version: 1.0',
        'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
        'Date: ' . date(DATE_RFC2822),
    ];

    $body = [];
    $body[] = '--' . $boundary;
    $body[] = 'Content-Type: text/plain; charset=UTF-8';
    $body[] = 'Content-Transfer-Encoding: 8bit';
    $body[] = '';
    $body[] = $textBody;
    $body[] = '';
    $body[] = '--' . $boundary;
    $body[] = 'Content-Type: text/html; charset=UTF-8';
    $body[] = 'Content-Transfer-Encoding: 8bit';
    $body[] = '';
    $body[] = $htmlBody;
    $body[] = '';
    $body[] = '--' . $boundary . '--';

    return implode("\r\n", $headers) . "\r\n\r\n" . implode("\r\n", $body);
}

function sendSmtpMail(string $toAddress, string $subject, string $textBody, string $htmlBody): bool {
    if (!SMTP_ENABLED) {
        return false;
    }

    $host = SMTP_HOST;
    $port = SMTP_PORT;
    $secure = strtolower(SMTP_SECURE);
    $user = SMTP_USER;
    $pass = SMTP_PASS;

    if ($host === '' || $port <= 0 || $user === '' || $pass === '') {
        throw new RuntimeException('SMTP config incomplete');
    }

    $transport = ($secure === 'ssl') ? 'ssl://' . $host : $host;
    $sslCtx = stream_context_create([
        'ssl' => [
            'verify_peer'       => false,
            'verify_peer_name'  => false,
        ],
    ]);
    $socket = @stream_socket_client(
        $transport . ':' . $port,
        $errno,
        $errstr,
        SMTP_TIMEOUT_SECONDS,
        STREAM_CLIENT_CONNECT,
        $sslCtx
    );

    if (!$socket) {
        throw new RuntimeException('SMTP connection failed: ' . $errstr . ' (' . $errno . ')');
    }

    stream_set_timeout($socket, SMTP_TIMEOUT_SECONDS);

    try {
        smtpExpect($socket, [220]);

        $ehloHost = SMTP_EHLO_HOST !== '' ? SMTP_EHLO_HOST : 'localhost';
        smtpWrite($socket, 'EHLO ' . $ehloHost);
        smtpExpect($socket, [250]);

        if ($secure === 'tls') {
            smtpWrite($socket, 'STARTTLS');
            smtpExpect($socket, [220]);

            stream_context_set_option($socket, 'ssl', 'verify_peer', false);
            stream_context_set_option($socket, 'ssl', 'verify_peer_name', false);
            $cryptoOk = stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            if ($cryptoOk !== true) {
                throw new RuntimeException('STARTTLS failed');
            }

            smtpWrite($socket, 'EHLO ' . $ehloHost);
            smtpExpect($socket, [250]);
        }

        smtpWrite($socket, 'AUTH LOGIN');
        smtpExpect($socket, [334]);

        smtpWrite($socket, base64_encode($user));
        smtpExpect($socket, [334]);

        smtpWrite($socket, base64_encode($pass));
        smtpExpect($socket, [235]);

        smtpWrite($socket, 'MAIL FROM:<' . MAIL_FROM_ADDRESS . '>');
        smtpExpect($socket, [250]);

        smtpWrite($socket, 'RCPT TO:<' . $toAddress . '>');
        smtpExpect($socket, [250, 251]);

        smtpWrite($socket, 'DATA');
        smtpExpect($socket, [354]);

        $mime = buildMimeMessage(MAIL_FROM_ADDRESS, MAIL_FROM_NAME, $toAddress, $subject, $textBody, $htmlBody);
        // SMTP DATA ends with CRLF . CRLF
        fwrite($socket, $mime . "\r\n.\r\n");
        smtpExpect($socket, [250]);

        smtpWrite($socket, 'QUIT');
        smtpExpect($socket, [221]);

        fclose($socket);
        return true;
    } catch (Throwable $e) {
        fclose($socket);
        throw $e;
    }
}

function sendAppMail(string $toAddress, string $subject, string $textBody, string $htmlBody): bool {
    if (SMTP_ENABLED) {
        return sendSmtpMail($toAddress, $subject, $textBody, $htmlBody);
    }

    $headers = [
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=UTF-8',
        'From: ' . MAIL_FROM_NAME . ' <' . MAIL_FROM_ADDRESS . '>',
        'Reply-To: ' . MAIL_FROM_ADDRESS,
        'X-Mailer: PHP/' . phpversion(),
    ];
    return @mail($toAddress, $subject, $htmlBody, implode("\r\n", $headers));
}
