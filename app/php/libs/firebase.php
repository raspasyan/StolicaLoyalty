<?php
require_once './vendor/autoload.php';

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use GuzzleHttp\Exception\RequestException;
use Plokko\Firebase\FCM\Exceptions\FcmErrorException;
use Plokko\Firebase\FCM\Message;
use Plokko\Firebase\FCM\Request;
use Plokko\Firebase\FCM\Targets\Token;
use Plokko\Firebase\ServiceAccount;

$serviceCredentials = './indriver-148622-a5223bc8248e.json';
$sa = new ServiceAccount($serviceCredentials);

$message = new Message();
$message->notification
            ->setTitle($title)
            ->setBody($body);

$message->data->fill([
   'title'=>$title
]);
$message->data->set('body', $body);
//$message->data->key3 = 'value3';
//$message->data['key4'] = 4;

$message->android->ttl = '10.4s';
$message->android->setPriorityHigh();
$message->android->data->fill(['android-specific'=>'data']);

$target = new Token($tokens);
$message->setTarget($target);


$client = new Client(['debug'=>false]);
$validate_only = false;
$rq = new Request($sa,$validate_only,$client);
$push_response["status"] = FALSE;

try{
    //$message->send($rq);
    $arr = $rq->submit($message);
    $push_validate = $message->validate($rq);
    
    if ($push_validate == 1) {
        $push_response["data"]["ext_id"] = explode("/", $arr)[3];
        $push_response["status"] = true;
    }
}

catch(FcmErrorException $e){
    switch($e->getErrorCode()){
        default:
        case 'UNSPECIFIED_ERROR':
        case 'INVALID_ARGUMENT':
        case 'UNREGISTERED':
        case 'SENDER_ID_MISMATCH':
        case 'QUOTA_EXCEEDED':
        case 'APNS_AUTH_ERROR':
        case 'UNAVAILABLE':
        case 'INTERNAL':
    }
    echo 'FCM error ['.$e->getErrorCode().']: ',$e->getMessage();
}

catch(RequestException $e){
    $response = $e->getResponse();
    echo 'Got an http response error:', $response->getStatusCode(), ':', $response->getReasonPhrase();
}

catch(GuzzleException $e){
    echo 'Got an http error:',$e->getMessage();
}