<?php

namespace PhonePe\common\utils;

use PhonePe\common\exceptions\PhonePeException;

/**
 * Custom CurlHttpClient that bypasses SSL verification for local development
 */
class CustomCurlHttpClient extends CurlHttpClient
{
    public static function postRequest($url, $body, $headers)
    {
        $headers_array = [];
        foreach ($headers as $key => $value) {
            $headers_array[] = $key . ":" . $value;
        }

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers_array);

        // ALWAYS disable SSL verification
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

        $response = curl_exec($ch);
        $responseHeaders = curl_getinfo($ch);
        $httpStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpStatus == 200)
            return new HttpResponse($httpStatus, $responseHeaders, $response);
        else {
            $responseArray = json_decode($response, true);
            $data = $responseArray['data'] ?? ($responseArray['context'] ?? null);
            $code = $responseArray['code'] ?? ($responseArray['errorCode'] ?? 'UNKNOWN');
            $msg = $responseArray['message'] ?? ("Gateway Error: " . $code);
            throw new PhonePeException($msg, $httpStatus, $code, $data);
        }
    }

    public static function getRequest($url, $headers)
    {
        $headers_array = [];
        foreach ($headers as $key => $value) {
            $headers_array[] = $key . ":" . $value;
        }

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers_array);

        // ALWAYS disable SSL verification
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

        $response = curl_exec($ch);
        $responseHeaders = curl_getinfo($ch);
        $httpStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpStatus == 200)
            return new HttpResponse($httpStatus, $responseHeaders, $response);
        else {
            $responseArray = json_decode($response, true);
            $data = $responseArray['data'] ?? ($responseArray['context'] ?? null);
            $code = $responseArray['code'] ?? ($responseArray['errorCode'] ?? 'UNKNOWN');
            $msg = $responseArray['message'] ?? ("Gateway Error: " . $code);
            throw new PhonePeException($msg, $httpStatus, $code, $data);
        }
    }
}
