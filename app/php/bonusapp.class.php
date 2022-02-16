<?php
class BonusApp {
    private $pdo = null;

    private $providers = [
        "DIG_FC",                   // Билайн
        "BEE"                       // Digital Flash Call
    ];

    public function __construct() {
        $this->setCORS();
    }

    private function __overload() {
        debug($this->initPDO());

        exit;
    }

    function setCORS() {
        $http_origin = $_SERVER['HTTP_ORIGIN'];
        if (isset($http_origin))
            header("Access-Control-Allow-Origin: $http_origin");
        header('Access-Control-Allow-Methods: POST');
        header("Access-Control-Allow-Headers: X-Requested-With");
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');

        if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
            if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
                header("Access-Control-Allow-Methods: POST, OPTIONS");

            if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
                header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
            exit(0);
        }
    }

    public function route() {
        $url = UTY::urlPrepare($_SERVER["REQUEST_URI"]);

        switch($url) {
            default: {
                header("Location: https://".$_SERVER["HTTP_HOST"]."/404");
                break;
            }

            case "": {
                // $valid_passwords = array ("2020" => "123");
                // $valid_users = array_keys($valid_passwords);

                // $user = $_SERVER['PHP_AUTH_USER'];
                // $pass = $_SERVER['PHP_AUTH_PW'];

                // $validated = (in_array($user, $valid_users)) && ($pass == $valid_passwords[$user]);

                // if (!$validated) {
                //   header('WWW-Authenticate: Basic realm="My Realm"');
                //   header('HTTP/1.0 401 Unauthorized');
                //   die ("Not authorized");
                // }

                require_once 'templates/index.html';
                break;
            }

            case "application-apple": {
                $this->mobileDetectHandler();
                // header("Location: https://apps.apple.com/ru/app/%D1%81%D1%82%D0%BE%D0%BB%D0%B8%D1%86%D0%B0-%D0%B1%D0%BE%D0%BD%D1%83%D1%81%D1%8B/id1590266964");
                break;
            }

            case "application-google": {
                $this->mobileDetectHandler();
                // header("Location: https://play.google.com/store/apps/details?id=com.stolica.bonuses");
                break;
            }

            case "application": {
                $this->mobileDetectHandler();
                break;
            }

            case "politika-konfidentsialnosti": {
                require_once 'templates/template_terms.php';
                break;
            }

            case "pravila": {
                require_once 'templates/template_rules_191021.php';
                break;
            }

            case "pravila_190421": {
                require_once 'templates/template_rules_190421.php';
                break;
            }

            case "pravila_080621": {
                require_once 'templates/template_rules_080621.php';
                break;
            }

            case "pravila_090721": {
                require_once 'templates/template_rules_090721.php';
                break;
            }

            case "pravila-akcii": {
                require_once 'templates/template_referral.php';
                break;
            }

            case "pravila-rozigrisha": {
                require_once 'templates/template_drawing.php';
                break;
            }

            case "api": {
                $rawRequestData = file_get_contents('php://input');
                if (!empty($rawRequestData)) {
                    $this->api($rawRequestData);
                } else {
                    if (empty($_GET) || $_GET["token"] != API_TOKEN) {
                        header("Location: https://".$_SERVER["HTTP_HOST"]);
                    } else {
                        $this->__overload();
                    }
                }

                break;
            }

            case "log": {
                $file_get = $_SERVER["DOCUMENT_ROOT"] . "/logs/get.log";
                $file_post = $_SERVER["DOCUMENT_ROOT"] . "/logs/post.log";

                if (!empty($_GET)) {
                    $fw = fopen($file_get, "a");
                    fwrite($fw, "HEADERS " . var_export(getallheaders(), true));
                    fwrite($fw, "GET " . var_export($_GET, true) . '');
                    fclose($fw);
                }

                if (!empty($_POST) || !empty(file_get_contents('php://input'))) {
                    $fw = fopen($file_post, "a");
                    fwrite($fw, "HEADERS " . var_export(getallheaders(), true));
                    fwrite($fw, "POST " . var_export($_POST, true));
                    fwrite($fw, "JSON " . var_export(file_get_contents('php://input'), true));
                    fclose($fw);
                }

                break;
            }

            case "sms": {
                // Пример: http://localhost/sms?token=API_TOKEN&phone=79635658436&message=hello
                if (empty($_GET) || $_GET["token"] != API_TOKEN || empty($_GET["phone"]) || empty($_GET["message"])) header("Location: https://".$_SERVER["HTTP_HOST"]."/");

                $result = $this->initPDO();
                if (!$result["status"]) {
                    echo(json_encode($result));
                    exit;
                }
                
                if (INPUT_LOG) $this->journal("INPUT", "", "", false, json_encode([
                    "header" => getallheaders(),
                    "get" => $_GET,
                    "post" => $_POST,
                    "json" => file_get_contents('php://input')
                ]));

                $phone = preg_replace("/[^0-9]/", "", $_GET["phone"]);
                $message = $_GET["message"];

                $result = $this->canSendMessage($phone);
                // ОТЛАДКА
                $this->journal("SMS", "canSendMessage", "", $result["status"], json_encode(["f" => "canSendMessage", "a" => [$phone]]), json_encode($result, JSON_UNESCAPED_UNICODE));
                if ($result["status"]) {
                    $provider = isset($result["data"]["provider"]) ? $this->getNextProvider($result["data"]["provider"]) : null;
                    $result = $this->sendMessage($phone, preg_replace("/[^0-9]/", "", $message), $provider);

                    // ОТЛАДКА
                    $this->journal("SMS", "sendMessage", "", $result["status"], json_encode(["f" => "sendMessage", "a" => [$phone, preg_replace("/[^0-9]/", "", $message), $provider]]), json_encode($result, JSON_UNESCAPED_UNICODE));
                }

                // КОСТЫЛЬ: если сообщение не было отправлено сообщаем кассе код 404. Касса не умеет читать сообщение в теле, она ориентируется по кодам страницы.
                if (!$result["status"]) {
                    header("HTTP/1.0 404 Not Found");
                    header("HTTP/1.1 404 Not Found");
                    header("Status: 404 Not Found");
                }

                echo(json_encode($result));
                break;
            }

            case "cron": {
                // Пример: http://localhost/cron?token=API_TOKEN&method=METHOD_NAME
                if (empty($_GET) || $_GET["token"] != API_TOKEN || empty($_GET["method"])) header("Location: https://".$_SERVER["HTTP_HOST"]."/");

                switch ($_GET["method"]) {
                    default: {
                        echo(1);
                        break;
                    }
                    case "completeregistration": {
                        print_r($this->service_completeRegistration());
                        break;
                    }
                    case "specialcharge": {
                        print_r($this->service_specialCharge());
                        break;
                    }
                    case "cron3": {
                        // print_r($this->uploadCC());
                        break;
                    }
                    case "cron4": {
                        // print_r($this->sendEmail());
                        break;
                    }
                    case "cron5": {
                        // print_r($this->sendEmailDrawing());
                        break;
                    }
                    case "cron7": {
                        print_r($this->service_drawingRemind());
                        break;
                    }
                    case "cron8": {
                        print_r($this->getBonuscardsToReferralCong());
                        break;
                    }
                    case "cron10": {
                        print_r($this->uploadDump());
                        break;
                    }
                    case "processing": {
                        print_r($this->service_processing());
                        break;
                    }
                    case "syncbonuscards": {
                        print_r($this->service_syncBonusCards());
                        break;
                    }
                    case "changediscountsystem": {
                        print_r($this->sheduler_changeDiscountSystem());
                        break;
                    }
                }

                break;
            }

            case "ref": {
                // Пример: http://localhost/ref?id=#
                if (empty($_GET) || empty($_GET["id"])) header("Location: https://".$_SERVER["HTTP_HOST"]."/");

                $result = $this->initPDO();
                if (!$result["status"]) header("Location: https://".$_SERVER["HTTP_HOST"]."/");

                $ref_id = preg_replace("/[^0-9]/", "", $_GET["id"]);
                $operationResult = $this->haveAccount($ref_id);
                if ($operationResult["status"]) {
                    setcookie("rsa_ref", $ref_id, strtotime('+12 month'));
                    header("Location: https://".$_SERVER["HTTP_HOST"]."/");
                } else {
                    header("Location: https://".$_SERVER["HTTP_HOST"]."/");
                }
                break;
            }

            case "bd": {
                // Пример: http://localhost/bd?tk=TOKEN
                if (!empty($_GET) || !empty($_GET["tk"])) {
                    $result = $this->initPDO();
                    if ($result["status"]) $this->authByToken($_GET["tk"]);
                }
                header("Location: https://".$_SERVER["HTTP_HOST"]."/");

                break;
            }

            case "404": {
                require_once 'templates/404.php';
                break;
            }
        }
    }

    private function api($rawRequestData) {
        $result = $this->initPDO();
        if (!$result["status"]) {
            echo(json_encode($result, JSON_UNESCAPED_UNICODE));
            exit;
        }

        try {
            $requestData = json_decode($rawRequestData, true);
            $resultData = array(
                "status" => false,
                "description" => "Who are you? I didn't call you."
            );

            if (isset($requestData["method"])) switch ($requestData["method"]) {
                case "regPhys": {
                    $resultData = $this->service_regPhysCards();
                    break;
                }

                case "checkAuthorization": {
                    $resultData = $this->checkAuthorization();
                    
                    break;
                }

                case "getUpdates": {
                    $resultData = $this->checkAuthorization($requestData["method"], $requestData["source"]);
                    if ($resultData["status"]) $resultData = $this->getUpdates($resultData["data"]["phone"], $requestData["data"]);

                    break;
                }

                case "authorization": {
                    if (!empty($requestData["data"]["phone"])) {
                        $phone = preg_replace("/[^0-9]/", "", $requestData["data"]["phone"]);

                        if (!empty($requestData["data"]["pass"])) {
                            $resultData = $this->API_AuthorizationHandler($phone, $requestData["data"]["pass"]);
                        } else {
                            $resultData["description"] = "Введите пароль";
                        }
                    } else {
                        $resultData["description"] = "Введите номер телефона";
                    }
                    break;
                }

                case "registration": {
                    if (!empty($requestData["data"]["phone"])) {
                        $phone = preg_replace("/[^0-9]/", "", $requestData["data"]["phone"]);

                        if (!empty($requestData["data"]["pass"])) {
                            $pass = $requestData["data"]["pass"];

                            $resultData = $this->API_RegistrationHandler($phone, $pass, [
                                    "firstname" => $requestData["data"]["firstname"],
                                    "birthdate" => $requestData["data"]["birthdate"],
                                    "email"     => $requestData["data"]["email"]
                                ],
                                $requestData["data"]["discount"],
                                $requestData["data"]["city"]
                            );
                        } else {
                            $resultData["description"] = "Введите пароль";
                        }
                    } else {
                        $resultData["description"] = "Введите номер телефона";
                    }
                    break;
                }

                case "confirmation": {
                    if (!empty($requestData["data"]["phone"]) && !empty($requestData["data"]["code"])) {
                        $phone = preg_replace("/[^0-9]/", "", $requestData["data"]["phone"]);
                        $code = preg_replace("/[^0-9]/", "", $requestData["data"]["code"]);

                        $resultData = $this->API_AccountConfirmationHandler($phone, $code);
                    } else {
                        $resultData = ["status" => false, "description" => "Отсутствуют данные"];
                    }
                    break;
                }

                case "confirmationReset": {
                    if (!empty($requestData["data"]["phone"])) {
                        $phone = preg_replace("/[^0-9]/", "", $requestData["data"]["phone"]);

                        $resultData = $this->API_RepeatAccountConfirmationHandler($phone);
                    } else {
                        $resultData = ["status" => false, "description" => "Отсутствуют данные"];
                    }
                    break;
                }

                case "getProfileData": {
                    $resultData = $this->checkAuthorization($requestData["method"]);
                    if ($resultData["status"]) $resultData = $this->getProfileDataByPhone($resultData["data"]["phone"]);
                    break;
                }

                case "getReferLink": {
                    $resultData = $this->checkAuthorization();
                    if ($resultData["status"]) $resultData = $this->getReferLink($resultData["data"]["id"]);
                    break;
                }

                case "canParticipateInDrawing": {
                    $resultData = $this->checkAuthorization();
                    if ($resultData["status"]) $resultData = $this->canParticipateInDrawing($resultData["data"]["card_number"], 50000, $resultData["data"]["id"]);
                    break;
                }

                case "addParticipateInDrawing": {
                    $resultData = $this->checkAuthorization();
                    if ($resultData["status"]) {
                        $accountId = $resultData["data"]["id"];
                        $resultData = $this->canParticipateInDrawing($resultData["data"]["card_number"], 50000, $accountId);
                        if ($resultData["status"] && $resultData["data"]["code"] == 2) {
                            $resultData = $this->addParticipateInDrawing($accountId, $requestData["data"]);
                        } else {
                            $resultData = [
                                "status" => false,
                                "data" => ["description" => $resultData["data"]["description"]]
                            ];
                        }
                    }
                    break;
                }

                case "setProfileData": {
                    $resultData = $this->checkAuthorization($requestData["method"]);
                    if ($resultData["status"]) {
                        $resultData = $this->setProfileDataByPhone($resultData["data"]["phone"], $requestData["data"]);
                    }
                    break;
                }

                case "getWalletData": {
                    $resultData = $this->checkAuthorization($requestData["method"]);
                    if ($resultData["status"]) $resultData = $this->API_getWalletData($resultData["data"]["token"], $requestData["data"]["last_id"], $requestData["data"]["only_balance"]);
                    
                    break;
                }

                case "updateWalletData": {
                    $resultData = $this->checkAuthorization();
                    if ($resultData["status"]) $resultData = $this->API_updateWalletData($resultData["data"]["personId"], $resultData["data"]["card_number"], $resultData["data"]["bonusCardLastSync"]);

                    break;
                }

                case "getBCD": {
                    if (!empty($requestData["data"]["cardNumber"])) {
                        $resultData = $this->getBonusCardData($requestData["data"]["cardNumber"]);
                    }
                    break;
                }

                case "changePassword": {
                    $resultData = $this->checkAuthorization($requestData["method"]);
                    if ($resultData["status"]) { $resultData = $this->setNewPassword($resultData["data"]["phone"], $requestData["data"]["new_password"]); }
                    break;
                }

                case "changeCardType": {
                    $resultData = $this->checkAuthorization($requestData["method"]);
                    if ($resultData["status"]) $resultData = $this->changeCardType($resultData["data"]["phone"], $requestData["data"]["discount"]);
                    break;
                }

                case "logOff": {
                    $resultData = $this->logOff();
                    break;
                }

                case "getResetConfirmationCode": {
                    if (!empty($requestData["data"]["phone"])) {
                        $phone = preg_replace("/[^0-9]/", "", $requestData["data"]["phone"]);

                        $operationResult = $this->checkPhone($phone);
                        if ($operationResult) {
                            $operationResult = $this->canSendConfirmationCode($phone);
                            if ($operationResult["status"]) {
                                $resultData = $this->sendConfirmationCode($phone);
                            } else {
                                $resultData = [
                                    "status" => true,
                                    "description" => "Код подтверждения уже был отправлен.",
                                    "data" => [
                                        "need_confirmation" => true,
                                        "seconds_left" => $operationResult["data"]["seconds_left"]
                                    ]
                                ];
                            }
                        } else {
                            $resultData = ["status" => false, "description" => "Номер телефона не зарегистрирован."];
                        }
                    } else {
                        $resultData = ["status" => false, "description" => "Отсутствуют данные"];
                    }
                    break;
                }

                case "checkResetConfirmationCode": {
                    if (!empty($requestData["data"]["phone"]) && !empty($requestData["data"]["code"])) {
                        $phone = preg_replace("/[^0-9]/", "", $requestData["data"]["phone"]);
                        $code = preg_replace("/[^0-9]/", "", $requestData["data"]["code"]);

                        $resultData = $this->checkConfirmationCode($phone, $code);
                        if ($resultData["status"]) {
                            // Авторизуем пользователя
                            $query = $this->pdo->prepare("SELECT token FROM accounts WHERE phone = :phone");
                            $query->execute(["phone" => $phone]);
                            $queryResult = $query->fetchAll();
                            if (count($queryResult)) {
                                setcookie("token", $queryResult[0]["token"], strtotime('+12 month'));
                                $resultData["data"] = [
                                    "token" => $queryResult[0]["token"]
                                ];
                            }
                        }
                    } else {
                        $resultData = ["status" => false, "description" => "Отсутствуют данные"];
                    }
                    break;
                }

                case "importStores": {
                    if ($requestData["data"]["token"] == API_TOKEN && $requestData["data"]["stores"]) $resultData = $this->importStores($requestData["data"]["stores"]);
                    break;
                }

                case "getStores": {
                    $resultData = $this->getStores();
                    break;
                }

                case "getStoresList": {
                    $resultData = $this->getStoresList($requestData["city_id"]);
                    break;
                }

                case "updateProfile": {
                    $resultData = $this->setProfileDataByPhone($requestData["phone"], $requestData["data"]);

                    break;
                }

                case "getDrawingWinners": {
                    $resultData = $this->getDrawingWinners();

                    break;
                }

                case "showPopupDrawing": {
                    $resultData = $this->showPopupDrawing();

                    break;
                }

                case "getCities": {
                    $resultData = $this->getCities();

                    break;
                }

                case "getNews": {
                    $resultData = $this->API_getNews(
                        (!empty($requestData["data"]["lastId"]) ? $requestData["data"]["lastId"] : 0), 
                        (!empty($requestData["data"]["limit"]) ? $requestData["data"]["limit"] : null)
                    );

                    break;
                }

                case "setCard": {
                    $resultData = $this->checkAuthorization($requestData["method"]);
                    if ($resultData["status"]) $resultData = $this->API_setCard($resultData["data"]["id"], $resultData["data"]["personId"], $requestData["data"]["card_number"]);
                    break;
                }

                case "setFeedback": {
                    $resultData = $this->API_setFeedback($requestData["data"]);

                    break;
                }
            }
        } catch (\Throwable $th) {
            $resultData = array(
                "status" => false,
                "description" => "Что-то пошло не так.",
                "error" => $th->getMessage()
            );
        }

        echo(json_encode($resultData, JSON_UNESCAPED_UNICODE));
    }

    /* Обработчики API */

    private function API_RegistrationHandler($phone, $pass, $profile, $discount = false, $cityId) {
        $result = ["status" => false, "description" => ""];

        $query = $this->pdo->prepare("SELECT status FROM accounts WHERE phone = :phone");
        $query->execute([$phone]);
        $queryResult = $query->fetchAll();
        if (count($queryResult)) {
            if ($queryResult[0]["status"] == 0) {
                $operationResult = $this->canSendConfirmationCode($phone);
                if ($operationResult["status"]) {
                    $result = $this->sendConfirmationCode($phone);
                } else {
                    $result = [
                        "status" => true,
                        "description" => "Введите код подтверждения",
                        "data" => [
                            "need_confirmation" => true,
                            "seconds_left" => $operationResult["data"]["seconds_left"]
                        ]
                    ];
                }
            } else {
                $result["description"] = "Вы уже зарегистрированы";
            }
        } else {
            $getCityByIdResult = $this->getCityById($cityId);
            if ($getCityByIdResult["status"]) {
                $discountValue = $getCityByIdResult["data"]["discount_value"];
                $preferredDiscount = $discount;

                $this->pdo->beginTransaction();
                $result = $this->registration($phone, $pass, $preferredDiscount, $discountValue, $preferredDiscount);
                if ($result["status"]) {
                    $accountId = $result["data"]["account_id"];

                    if (!empty($_COOKIE["rsa_ref"])) $this->addReferral($_COOKIE["rsa_ref"], $accountId);
                    
                    $profile["city"] = $getCityByIdResult["data"]["title"];
                    $result = $this->setProfileDataByPhone($phone, $profile);

                    if ($result["status"]) {
                        $result = $this->sendConfirmationCode($phone);

                        if ($result["status"]) $this->pdo->commit();
                    }
                }
            } else {
                $result["description"] = "Не удалось определить город.";
            }
        }

        return $result;
    }

    private function API_AuthorizationHandler($phone, $pass) {
        if (!$phone) return ["status" => 0, "description" => "Не указан логин!"];
        if (mb_strlen($phone, "UTF-8") < 6) return ["status" => 0, "description" => "Логин должен содержать не менее 6 символов."];
        if (!$pass) return ["status" => 0, "description" => "Не указан пароль!"];
        if (mb_strlen($pass, "UTF-8") < 6) return ["status" => 0, "description" => "Пароль должен содержать не менее 6 символов."];

        $result = $this->checkPassword($phone, $pass);
        if ($result["status"]) {
            setcookie("token", $result["data"], strtotime('+12 month'));
            $result = [
                "status" => true,
                "description" => "Добро пожаловать!",
                "data" => [
                    "token" => $result["data"]
                ]
            ];
        } else {
            $result = [
                "status" => false,
                "description" => "Неверное имя пользователя или пароль."
            ];
        }

        return $result;
    }

    private function API_AccountConfirmationHandler($phone, $code) {
        $result = $this->checkConfirmationCode($phone, $code);

        if ($result["status"]) {
            try {
                // Активируем учетную запись
                $query = $this->pdo->prepare("UPDATE accounts SET status = 1 WHERE phone = :phone");
                $queryExecuteResult = $query->execute(["phone" => $phone]);
                if ($queryExecuteResult) {
                    $query = $this->pdo->prepare("SELECT token FROM accounts WHERE phone = :phone AND status != 0");
                    $query->execute(["phone" => $phone]);
                    $queryResult = $query->fetchAll();
                    if (count($queryResult)) {
                        // Авторизуем пользователя
                        setcookie("token", $queryResult[0]["token"], strtotime('+12 month'));
                        $result = [
                            "status" => true,
                            "description" => "Добро пожаловать.",
                            "data" => [
                                "token" => $queryResult[0]["token"]
                            ]
                        ];

                        // Регистрация клиента и карты лояльности во внешнем процессинге
                        // Оставляем на планировщик, чтобы избежать наложений.
                        // $LMX = $this->getLMX();
                        // $regExtProfileResult = $this->service_regExtProfile($LMX, $phone);
                        // if ($regExtProfileResult["status"]) $emitCardResult = $this->service_emitCard($LMX, $phone, $regExtProfileResult["data"]["personId"]);  

                        // Генерация токена для входа по ссылке
                        $linkToSite = "https://" . SITE_DOMAIN;
                        $opResult = $this->getAccountDataByPhone($phone);
                        if ($opResult["status"]) {
                            $opResult = $this->getTokenByAccountId($opResult["data"]["id"]);
                            if ($opResult["status"]) {
                                if (!empty($opResult["alias"])) {
                                    $linkToSite = $opResult["alias"];
                                } else if (!empty($opResult["data"])) {
                                    $linkToSite .= "/bd?tk=" . $opResult["data"];
                                }
                            }
                        }
                        $sendMessageResult = $this->sendMessage($phone, "Вы зарегистрировались, перейти в ЛК: " . $linkToSite, DEFAULT_SMS_PROVIDER);
                        if (!$sendMessageResult["status"]) $this->journal("APP", __FUNCTION__, json_encode($sendMessageResult, JSON_UNESCAPED_UNICODE), $sendMessageResult["status"]);        
                    } else {
                        $result["status"] = false;
                        $result["desription"] = "Не удалось авторизоваться, повторите попытку позднее.";
                    }
                } else {
                    $result["status"] = false;
                    $result["desription"] = "Не удалось активировать учетную запись, повторите попытку позднее.";
                }
            } catch (\Throwable $th) {
                $result["status"] = false;
                $result["desription"] = $th->getMessage();
            }
        }

        return $result;
    }

    private function API_RepeatAccountConfirmationHandler($phone) {
        $result = ["status" => false, "description" => ""];

        $result = $this->canSendConfirmationCode($phone);
        if ($result["status"]) $result = $this->sendConfirmationCode($phone, DEFAULT_SMS_PROVIDER);

        return $result;
    }

    private function API_updateWalletData($personId, $cardNumber, $bonusCardLastSync, $debug = false) {
        $result = ["status" => false, "data" => null];

        $lastPurchaseDate = "2021-01-01 00:00:00";
        $getLastPurchaseResult = $this->getLastPurchase($personId);
        if ($getLastPurchaseResult["status"]) $lastPurchaseDate = $getLastPurchaseResult["data"]["sale_time"];

        $cd = new DateTime();
        $cd_time = strtotime($cd->format('Y-m-d H:i:s'));
        $ls_time = strtotime($bonusCardLastSync);
        $dd = $cd_time - $ls_time;

        // Подгружаем актуальный баланс из процессинговой системы
        if (($dd >= WALLET_TIMEOUT_SECONDS || $dd < 0)) {
            $result = $this->updateCardDataByLMX($personId, $cardNumber, $lastPurchaseDate);
        } else {
            $result["data"] = "Запрос баланса будет доступен через: [" . (WALLET_TIMEOUT_SECONDS - $dd) . "] секунд.";
        }

        return $result;
    }

    private function API_getWalletData($token, $lastId = 0, $onlyBalance = false) {
        $result = ["status" => false, "data" => null];

        $operationResult = $this->getFullAccountDataByToken($token);
        if ($operationResult["status"]) {
            $cardNumber         = $operationResult["data"]["card_number"];
            $cardBalance        = $operationResult["data"]["balance"];
            $lastSync           = $operationResult["data"]["card_last_sync"];
            $personId           = $operationResult["data"]["ext_id"];
            $lastPurchase       = $operationResult["data"]["last_purchase"];
            $discount           = $operationResult["data"]["discount"];
            $discountValue      = $operationResult["data"]["discount_value"];
            $preferredDiscount  = $operationResult["data"]["preferred_discount"]; 

            $cd = new DateTime();
            $cd_time = strtotime($cd->format('Y-m-d H:i:s'));
            $ls_time = strtotime($lastSync);
            $dd = $cd_time - $ls_time;

            // Подгружаем актуальный баланс из процессинговой системы
            if (($dd >= WALLET_TIMEOUT_SECONDS || $dd < 0) && !$onlyBalance) $this->updateCardDataByLMX($personId, $cardNumber, $lastPurchase);

            // Подгрузка текущего баланса
            $getBonusCardDataResult = $this->getBonusCardData($cardNumber);
            if ($getBonusCardDataResult["status"]) $cardBalance = $getBonusCardDataResult["data"]["balance"];

            $result["data"]["purchases"] = [];
            $getLastPurchaseResult = $this->getLastPurchase($personId);
            if ($getLastPurchaseResult["status"]) {
                if ($getLastPurchaseResult["data"]["id"] != $lastId) {
                    $getFullPurchasesDataByDateResult = $this->getFullPurchasesData($personId);
                    if ($getFullPurchasesDataByDateResult["status"]) $result["data"]["purchases"] = $getFullPurchasesDataByDateResult["data"];
                }
            }

            $result["status"] = true;
            $result["data"]["cardNumber"]           = $cardNumber;
            $result["data"]["discount"]             = $discount;
            $result["data"]["discountValue"]        = $discountValue;
            $result["data"]["preferredDiscount"]    = $preferredDiscount; 
            $result["data"]["balance"]              = $cardBalance / 100;
        } else {
            $result = [
                "status" => true,
                "data" => [],
                "description" => "Выполняется регистрация бонусного счёта."
            ];
        }

        return $result;
    }

    private function API_setCard($accountId, $personId, $cardNumber) {
        $result = ["status" => false, "description" => "", "data" => null];

        $cardData = $this->getBonusCardData($cardNumber);
        if ($cardData['status']) {
            if ($cardData['data']['status'] == 3) {
                $LMX = $this->getLMX();
                $getConsumerCardsResult = $LMX->getConsumerCards($personId);
                if ($getConsumerCardsResult["status"]) {
                    $needToUpdateBonuscardData = false;

                    $currentCardNumber = "";

                    // Находим первую рабочую карту, считаем её основной
                    foreach ($getConsumerCardsResult["data"] as $cardData) {
                        if ($cardData != 'block') {
                            $currentCardNumber = $cardData->number;
                            break;
                        }
                    }

                    if ($currentCardNumber == $cardNumber) {
                        $needToUpdateBonuscardData = true;
                    } else {
                        $setCardToAccountResult = $LMX->setCardToAccount($personId, $cardNumber);
                        if ($setCardToAccountResult["status"]) {
                            $needToUpdateBonuscardData = true;
                        } else {
                            $result["description"] = $setCardToAccountResult["description"];
                        }
                    }

                    if ($needToUpdateBonuscardData) {
                        $setBonusCardDataResult = $this->setBonusCardData($cardNumber, ["account_id" => $accountId, "status" => 0, "balance" => 200000]);
                        if ($setBonusCardDataResult["status"]) {
                            $result["status"] = true;
                            $result["description"] = "Карта прикреплена";
                        } else {
                            $result["description"] = "Не удалось привязать карту к клиенту";
                        }
                    }
                } else {
                    $result["description"] = $getConsumerCardsResult["description"];
                }
            } else {
                $result["description"] = ($cardData['data']['account_id'] == $accountId ? "Карта уже привязана" : "Карта не может быть привязана");
            }
        } else {
            $result["description"] = "Карта не найдена";
        }

        return $result;
    }

    private function API_getNews($lastNewsId = 0, $limit = 10) {
        return $this->getNews($lastNewsId, $limit);
    }

    private function API_setFeedback($data) {
        $phone = ""; 
        $authResult = $this->checkAuthorization();
        if ($authResult["status"]) $phone = $authResult["data"]["phone"];
        $data["phone"] = preg_replace("/[^0-9]/", "", $data["phone"]);
        
        return $this->setFeedback($phone, $data);
    }

    /* Утилитарные ф-ии */

    public function initPDO() {
        $result = ["status" => false];

        $start = microtime(true);

        try {
            $this->pdo = new PDO("mysql:host=".DB_HOST.";dbname=".DB_NAME.";charset=utf8", DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);

            $result["status"] = true;
            $result["data"] = [
                "connection_time" => round(microtime(true) - $start, 4)
            ];
        } catch (\Throwable $th) {
            $result["description"] = "Сервис временно недоступен, выполяются профилактические работы.";
        }

        return $result;
    }

    public function uploadCC() {
        $operationResult = $this->initPDO();
        if ($operationResult["status"]) {
            $this->pdo->beginTransaction();
            $query = $this->pdo->prepare("SELECT CASE WHEN p.sex = 1 THEN 73 WHEN p.sex = 2 THEN 73 WHEN p.sex = 0 THEN 73 END AS 'template', CASE WHEN p.sex = 1 THEN '' WHEN p.sex = 2 THEN '' WHEN p.sex = 0 THEN '' END AS 'code',  p.middlename, p.firstname, p.lastname, a.phone, b.balance DIV 100 FROM `bonuscards` b INNER JOIN `profiles` p ON b.account_id = p.account_id INNER JOIN `accounts` a ON b.account_id = a.id WHERE b.card_number NOT IN ('0301005ZKA55BF', '03010018AR48PE', '0301002HCJB3IL', '0301003VRSS2DR', '03010046AU2F5H')");
            $query->execute();
            $queryResult = $query->fetchAll();
            $this->pdo->commit();

            $temp_file_path = tempnam(sys_get_temp_dir(), "uploadCC");
            $fp = fopen($temp_file_path, 'w');

            foreach ($queryResult as $fields) {
                fputcsv($fp, $fields, ';');
            }

            $file = "dataexchange/in/stolica/notify_for_bonus/cards.csv";
            $local_file = $temp_file_path;

            $conn_id = ftp_connect(FTP_HOST,FTP_PORT);
            $login_result = ftp_login($conn_id, FTP_LOGIN, FTP_PASS);

            ftp_pasv($conn_id, true);

            if (ftp_put($conn_id, $file, $local_file, FTP_ASCII)) {
                echo "file успешно загружен на сервер";
            } else {
                echo "Не удалось загрузить file на сервер";
            }
            ftp_close($conn_id);
            fclose($fp);
            exit;
        }
    }

    public function uploadDump() {
        $operationResult = $this->initPDO();
        if ($operationResult["status"]) {

            $fileName = '/var/db/dump/stolica_bonusapp__'.date("YmdHis");
            $output = shell_exec('mysqldump -u root -pO3sVT*Ib stolica_bonusapp > '.$fileName);

            $file = "dump/".$fileName;

            $conn_id = ftp_connect('10.100.210.41',FTP_PORT);
            $login_result = ftp_login($conn_id, 'IB', 'Euy8AmXDQukSAR2d');

            ftp_pasv($conn_id, true);

            if (ftp_put($conn_id, $file, $fileName, FTP_ASCII)) {
                echo "file успешно загружен на сервер";
            } else {
                echo "Не удалось загрузить file на сервер";
            }
            ftp_close($conn_id);
            exit;
        }
    }

    public function sendEmail() {
        $operationResult = $this->initPDO();
        if ($operationResult["status"]) {
            $query = $this->pdo->prepare("SELECT DISTINCT d.id, p.discount_card, CASE WHEN NOT d.confirmation_date IS NULL THEN 1 ELSE 0 END confirmation, d.confirmation_date, d.winner FROM purchases p LEFT JOIN bonuscards b ON p.discount_card = b.card_number LEFT JOIN drawing d ON b.account_id = d.account_id WHERE NOT d.confirmation_date IS NULL AND p.sale_time BETWEEN DATE_ADD(DATE_FORMAT(DATE_ADD(NOW(), INTERVAL -(DAYOFWEEK(NOW())-1) DAY), '%Y-%m-%d'), INTERVAL 11 HOUR) AND DATE_ADD(DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 7-DAYOFWEEK(NOW()) DAY), '%Y-%m-%d'), INTERVAL 21*60+59 MINUTE)");
            $query->execute();
            $queryResult = $query->fetchAll();
            $head = [
                '№ участника',
                'Карта',
                'Регистрация',
                'Дата регистрации',
            ];

            $temp_file_path = tempnam(sys_get_temp_dir(), 'drawing');
            $fp = fopen($temp_file_path, 'w');
            fputs($fp, chr(0xEF) . chr(0xBB) . chr(0xBF));

            fputcsv($fp, $head, ';');

            foreach ($queryResult as $fields) {
                fputcsv($fp, $fields, ';');
            }
            fclose($fp);

            $mailto = 'i.gerovskyi@rsa.khv.ru';
            $subject = 'Subject';
            $message = 'My message';

            $content = file_get_contents($temp_file_path);
            $content = chunk_split(base64_encode($content));

            // a random hash will be necessary to send mixed content
            $separator = md5(time());

            // carriage return type (RFC)
            $eol = "\r\n";

            // main header (multipart)
            $headers = "From: info@stolica-dv.ru" . $eol;
            $headers .= "MIME-Version: 1.0" . $eol;
            $headers .= "Content-Type: multipart/mixed; boundary=\"" . $separator . "\"" . $eol;
            $headers .= "Content-Transfer-Encoding: 7bit" . $eol;
            $headers .= "This is a MIME encoded message." . $eol;

            // message
            $body = "--" . $separator . $eol;
            $body .= "Content-Type: text/plain; charset=\"iso-8859-1\"" . $eol;
            $body .= "Content-Transfer-Encoding: 8bit" . $eol;
            $body .= $eol . $message . $eol . $eol;

            // attachment
            $body .= "--" . $separator . $eol;
            $body .= "Content-Type: application/octet-stream; name=drawing.csv" . $eol;
            $body .= "Content-Transfer-Encoding: base64" . $eol;
            $body .= "Content-Disposition: attachment" . $eol;
            $body .= $eol . $content . $eol . $eol;
            $body .= "--" . $separator . "--";


            //SEND Mail
            if (mail($mailto, $subject, $body, $headers)) {
                echo "mail send ... OK";
            } else {
                echo "mail send ... ERROR!";
                print_r( error_get_last() );
            }

            // Фиксация завершения обработки
            $cd = new DateTime();
            $query = $this->pdo->prepare("UPDATE settings SET value = ? WHERE setting = 'last_cron4'");
            $query->execute([$cd->format('Y-m-d H:i:s')]);

        }
    }

    public function mobileDetectHandler() {
        require_once 'libs/Mobile_Detect.php';
        $detect = new Mobile_Detect;

        if ($detect->isiOS()) {
            header("Location: https://apps.apple.com/ru/app/%D1%81%D1%82%D0%BE%D0%BB%D0%B8%D1%86%D0%B0-%D0%B1%D0%BE%D0%BD%D1%83%D1%81%D1%8B/id1590266964");
        } elseif ($detect->isAndroidOS()) {
            header("Location: https://play.google.com/store/apps/details?id=com.stolica.bonuses");
        } else {
            header("Location: https://".$_SERVER["HTTP_HOST"]);
        }
    }

    /* Сервисные ф-ии */

    public function service_completeRegistration() {
        $operationResult = $this->initPDO();
        if ($operationResult["status"]) {
            $start = microtime(true);

            // Регистрация профилей
            $this->service_regExtProfiles();

            // Выпуск карт лояльности
            $this->service_emitCards();

            // Фиксация завершения обработки
            $this->journal("CRON", __FUNCTION__, round(microtime(true) - $start, 4), true);
        }
    }

    public function service_specialCharge() {
        $operationResult = $this->initPDO();
        if ($operationResult["status"]) {
            $start = microtime(true);

            $LMX = $this->getLMX();

            // Начисление бонусов по реферальной программе
            $this->service_chargeToReferrs($LMX);

            // Начисление поздравительных (день рождения) бонусных баллов в CENTRUM
            $this->service_chargeOnBirthday($LMX);

            // Фиксация завершения обработки
            $this->journal("CRON", __FUNCTION__, round(microtime(true) - $start, 4), true);

            return 1;
        } else {
            return 2;
        }
    }

    public function service_drawingRemind() {
        $operationResult = $this->initPDO();
        if ($operationResult["status"]) {
            // Рассылка напоминаний о возможности участия в розыгрыше
            $this->service_sendMessagesToClientsWithoutDrawing();

            // Фиксация завершения обработки
            $cd = new DateTime();
            $query = $this->pdo->prepare("UPDATE settings SET value = ? WHERE setting = 'last_cron3'");
            $query->execute([$cd->format('Y-m-d H:i:s')]);
        }
    }

    public function service_processing() {
        $operationResult = $this->initPDO();
        if ($operationResult["status"]) {
            $start = microtime(true);

            // Получаем список чеков, позиций внутри чеков и сумму к начислению
            $operationResult = $this->getPurchasesToProcessing();
            if ($operationResult["status"]) {
                foreach ($operationResult["data"] as $key => $purchase) {
                    $chargeOnResult = $this->service_processing_chargeOn($purchase["purchase_id"], $purchase["card_number"], $purchase["cashback_value"], $purchase["shopNum"], $purchase["cashNum"], $purchase["shiftNum"], $purchase["checkNum"]);
                    $this->journal("APP", "service_processing_chargeOn", json_encode([
                        "purchaseId" => $purchase["purchase_id"],
                        "cardNumber" => $purchase["card_number"],
                        "cashbackValue" => $purchase["cashback_value"],
                        "shopNum" => $purchase["shopNum"],
                        "cashNum" => $purchase["cashNum"],
                        "shiftNum" => $purchase["shiftNum"],
                        "checkNum" => $purchase["checkNum"],
                    ], JSON_UNESCAPED_UNICODE), $chargeOnResult["status"]
                    );
                }
            }

            // Фиксация завершения обработки
            $cd = new DateTime();
            $this->pdo->beginTransaction();
            $query = $this->pdo->prepare("UPDATE settings SET value = ? WHERE setting = 'last_cron_processing'");
            $query->execute([$cd->format('Y-m-d H:i:s')]);

            $query = $this->pdo->prepare("UPDATE settings SET value = ? WHERE setting = 'seconds_cron_processing'");
            $query->execute([round(microtime(true) - $start, 4)]);
            $this->pdo->commit();
        }
    }

    public function service_syncBonusCards() {
        $operationResult = $this->initPDO();
        if ($operationResult["status"]) {
            $start = microtime(true);

            $results = [];

            // Сперва обновляем карты у которых есть свежие чеки, затем работаем со всеми остальными
            $getCardsToSync = $this->getCardsToUpdateByPurchases();
            if (!$getCardsToSync["status"]) $getCardsToSync = $this->getOutdatedCards(100);

            if ($getCardsToSync["status"]) foreach ($getCardsToSync["data"] as $key => $value) {
                $getWalletDataResult = $this->updateCardData($value["card_number"], $value["last_sync"]);
                if (!$getWalletDataResult["status"]) $this->journal("CRON", "service_syncBonusCards", json_encode(["cardNumber" => $value["card_number"], "lastSync" => $value["last_sync"]], JSON_UNESCAPED_UNICODE), $getWalletDataResult["status"]);

                array_push($results, $getWalletDataResult);
            }

            print_r($results);

            // Фиксация завершения обработки
            $cd = new DateTime();
            $this->pdo->beginTransaction();
            $query = $this->pdo->prepare("UPDATE settings SET value = ? WHERE setting = 'cron_syncbonuscards_start'");
            $query->execute([$cd->format('Y-m-d H:i:s')]);

            $query = $this->pdo->prepare("UPDATE settings SET value = ? WHERE setting = 'cron_syncbonuscards_duration'");
            $query->execute([round(microtime(true) - $start, 4)]);
            $this->pdo->commit();
        }
    }

    private function service_regExtProfiles() {
        $getAccountsWithoutExtProfileResult = $this->getAccountsWithoutExtProfile();
        if ($getAccountsWithoutExtProfileResult["status"]) {
            $LMX = $this->getLMX();
            foreach ($getAccountsWithoutExtProfileResult["data"] as $key => $account) $this->service_regExtProfile($LMX, $account["phone"]);
        }
    }

    private function service_regExtProfile($LMX, $phone) {
        $result = ["status" => false, "description" => ""];

        $getProfileDataResult = $this->getProfileDataByPhone($phone);
        if ($getProfileDataResult["status"]) {
            $registerConsumerResult = $LMX->registerConsumer($phone, $getProfileDataResult["data"]);
            if ($registerConsumerResult["status"]) {
                $personId = $registerConsumerResult["data"]["personId"];
                $setDiscountAttributeValue = $LMX->setDiscountAttributeValue($personId, boolval($getProfileDataResult["data"]["discount"]));
                if ($setDiscountAttributeValue["status"]) {
                    $setProfileDataResult = $this->setProfileDataByPhone($phone, ["ext_id" => $personId]);
                    if ($setProfileDataResult["status"]) {
                        $result["status"] = true;
                        $result["data"] = ["personId" => $personId];
                    } else {
                        $result = $setProfileDataResult;
                        $this->journal("CRON", __FUNCTION__, "", $setProfileDataResult["status"], json_encode(["f" => "setProfileDataByPhone", "a" => [$phone, ["ext_id" => $personId]]]), json_encode($setProfileDataResult, JSON_UNESCAPED_UNICODE));   
                    }
                } else {
                    $result = $setDiscountAttributeValue;
                    $this->journal("CRON", __FUNCTION__, "", $setDiscountAttributeValue["status"], json_encode(["f" => "LMX->setDiscountAttributeValue", "a" => [$personId, $getProfileDataResult["data"]["discount"]]]), json_encode($setDiscountAttributeValue, JSON_UNESCAPED_UNICODE));
                }
            } else {
                $result = $registerConsumerResult;
                $this->journal("CRON", __FUNCTION__, "", $registerConsumerResult["status"], json_encode(["f" => "LMX->registerConsumer", "a" => [$phone, $getProfileDataResult["data"]]]), json_encode($registerConsumerResult, JSON_UNESCAPED_UNICODE));
            }
        } else {
            $result = $getProfileDataResult;
            $this->journal("CRON", __FUNCTION__, "", $getProfileDataResult["status"], json_encode(["f" => "LMX->getProfileDataByPhone", "a" => [$phone]]), json_encode($getProfileDataResult, JSON_UNESCAPED_UNICODE));
        }

        return $result;
    }

    private function service_emitCards() {
        $getAccountsWithoutExtCardResult = $this->getAccountsWithoutExtCard();
        if ($getAccountsWithoutExtCardResult["status"]) {
            $LMX = $this->getLMX();
            foreach ($getAccountsWithoutExtCardResult["data"] as $key => $account) $this->service_emitCard($LMX, $account["phone"], $account["ext_id"]);
        }
    }

    private function service_emitCard($LMX, $phone) {
        $result = ["status" => false, "description" => ""];

        $getProfileDataResult = $this->getProfileDataByPhone($phone);
        if ($getProfileDataResult["status"]) {
            $accountId = $getProfileDataResult["data"]["account_id"];
            $personId = $getProfileDataResult["data"]["ext_id"];
            $emitVirtualResult = $LMX->emitVirtual($personId);
            if ($emitVirtualResult["status"]) {
                $getConsumerCardsResult = $LMX->getConsumerCards($personId);
                if ($getConsumerCardsResult["status"]) {
                    $cardNumber = "";

                    // Находим первую рабочую карту, считаем её основной
                    foreach ($getConsumerCardsResult["data"] as $cardData) {
                        if (!$cardData->block) {
                            $cardNumber = $cardData->number;
                            break;
                        }
                    }

                    if (!empty($cardNumber)) {
                        $getBonusCardDataResult = $this->getBonusCardData($cardNumber);
                        if ($getBonusCardDataResult["status"]) {
                            $setBonusCardDataResult = $this->setBonusCardData($cardNumber, ["account_id" => $accountId, "status" => 1]);
                            if ($setBonusCardDataResult["status"]) {
                                $result["status"] = true;
                                $result["description"] = "Привязана существующая карта";
                            } else {
                                $result = $setBonusCardDataResult;
                                $this->journal("CRON", __FUNCTION__, "", $setBonusCardDataResult["status"], json_encode(["f" => "setBonusCardData", "a" => [$cardNumber, ["account_id" => $accountId, "status" => 1]]]), json_encode($setBonusCardDataResult, JSON_UNESCAPED_UNICODE));
                            }
                        } else {
                            $addBonusCardResult = $this->addBonusCard($phone, $cardNumber);
                            if ($addBonusCardResult["status"]) {
                                $result["status"] = true;
                                $result["description"] = "Создана новая карта";
                            } else {
                                $result = $addBonusCardResult;
                                $this->journal("CRON", __FUNCTION__, "", $addBonusCardResult["status"], json_encode(["f" => "addBonusCard", "a" => [$phone, $cardNumber]]), json_encode($addBonusCardResult, JSON_UNESCAPED_UNICODE));
                            }
                        }
                    } else {
                        $result["status"] = false;
                        $result["description"] = "Нет ни одной активной карты, быть такого не может.";
                    }
                } else {
                    $result = $getConsumerCardsResult;
                    $this->journal("CRON", __FUNCTION__, "", $getConsumerCardsResult["status"], json_encode(["f" => "LMX->getConsumerCards", "a" => [$personId]]), json_encode($getConsumerCardsResult, JSON_UNESCAPED_UNICODE));
                }
            } else {
                $result = $emitVirtualResult;
                $this->journal("CRON", __FUNCTION__, "", $emitVirtualResult["status"], json_encode(["f" => "LMX->emitVirtual", "a" => [$personId]]), json_encode($emitVirtualResult, JSON_UNESCAPED_UNICODE));
            }
        } else {
            $result = $getProfileDataResult;
            $this->journal("CRON", __FUNCTION__, "", $getProfileDataResult["status"], json_encode(["f" => "LMX->getProfileDataByPhone", "a" => [$phone]]), json_encode($getProfileDataResult, JSON_UNESCAPED_UNICODE));
        }

        return $result;
    }

    private function service_chargeOnBirthday($LMX) {
        $opResult = $this->getBonuscardsWithBirthdates();
        if ($opResult["status"]) {
            foreach ($opResult["data"] as $key => $value) {
                if (isset($value["gift"]) && !empty($value["gift"])) {
                    $chargeResult = $LMX->chargeOn($value["card_number"], $value["gift"], $value["ext_id"], "День рождения");
                    $this->journal("CRON", __FUNCTION__, "", $chargeResult["status"], json_encode(["f" => "LMX->chargeOn", "a" => [$value["card_number"], $value["gift"], $value["ext_id"]]]), json_encode($chargeResult, JSON_UNESCAPED_UNICODE));
                    if ($chargeResult["status"]) {
                        $dt = new DateTime();
                        $updateResult = $this->setProfileDataByPhone($value["phone"], ["last_cong" => $dt->format('Y-m-d H:i:s')]);
                        $this->journal("CRON", __FUNCTION__, "", $updateResult["status"], json_encode(["f" => "setProfileDataByPhone", "a" => [$value["phone"], ["last_cong" => $dt->format('Y-m-d H:i:s')]]]), json_encode($updateResult, JSON_UNESCAPED_UNICODE));
                        
                        $dt->add(new DateInterval('P'.$value["expiration"].'D'));
                        $sendMessageResult = $this->sendMessage($value["phone"], "С наступающим Днем Рождения! Дарим 1000 бонусов (активны до ".$dt->format('Y-m-d')."). Подробнее https://clck.ru/Ugn5T Ваша «Столица»", DEFAULT_SMS_PROVIDER);
                    }
                }
            }
        }
    }

    private function service_chargeToReferrs($LMX) {
        $opResult = $this->getBonuscardsToReferralCong();
        if ($opResult["status"]) {
            foreach ($opResult["data"] as $key => $value) {
                if (isset($value["referral_gift"]) && !empty($value["referral_gift"])) {
                    $chargeResult = $LMX->chargeOn($value["card_number"], $value["referral_gift"], 19, "Приведи друга");
                    $this->journal("CRON", __FUNCTION__, "", $chargeResult["status"], json_encode(["f" => "LMX->chargeOn", "a" => [$value["card_number"], $value["referral_gift"], 2]]), json_encode($chargeResult, JSON_UNESCAPED_UNICODE));
                    if ($chargeResult["status"]) {
                        $updateResult = $this->updateReferral($value["account_id"], ["gifted" => true]);
                        $this->journal("CRON", __FUNCTION__, "", $updateResult["status"], json_encode(["f" => "updateReferral", "a" => [$value["account_id"], ["gifted" => true]]]), json_encode($updateResult, JSON_UNESCAPED_UNICODE));
                    }
                }
            }
        }
    }

    private function service_sendMessagesToClientsWithoutDrawing() {
        $operationResult = $this->getPhonesWhoCanParticipateInDrawing(50000);
        if ($operationResult["status"]) {
            foreach ($operationResult["data"] as $key => $value) {
                print_r($this->sendMessage($value["phone"], "У Вас уже есть чек от 500 рублей, регистрируйтесь сейчас в розыгрыше от «Столицы» и выигрывайте 4 000 рублей! Переходи " . $value["alias"], DEFAULT_SMS_PROVIDER));
            }
        }
    }

    public function service_processing_chargeOn($purchaseId, $cardNumber, $totalCashbackValue, $shopNum, $cashNum, $shiftNum, $checkNum) {
        $result = ["status" => false];

        $result = SRC::chargeOnBonusAccount($cardNumber, $totalCashbackValue, null, $shopNum, $cashNum, $shiftNum, $checkNum);
        if ($result["status"]) $result = $this->updatePurchase($purchaseId, ["processing_completed" => 1]);

        return $result;
    }

    public function service_regPhysCards() {
        $result = ["status" => false];

        $query = $this->pdo->prepare("SELECT card_number FROM bonuscards WHERE status = 99 LIMIT 1");
        $query->execute();
        $queryResult = $query->fetchAll();
        if (count($queryResult)) {
            $cards = [];
            foreach ($queryResult as $row) array_push($cards, $row["card_number"]);

            // return $cards;
            $requestResult = SRC::getCardsCatalog($cards, [
                "lastname"      => "",
                "firstname"     => "Anonymous",
                "middlename"    => "",
                "birthdate"     => "1991-01-01",
                "phone"         => "79999999999"
            ]);
            if ($requestResult["status"]) {
                $success = true;

                $this->pdo->beginTransaction();
                foreach ($cards as $card) {
                    $requestResult = $this->setBonusCardData($card, ["status" => 3]);
                    if ($requestResult["status"]) {
                        // echo(json_encode($requestResult, JSON_UNESCAPED_UNICODE));
                    } else {
                        $success = false;
                        break;
                    }
                }

                if ($success) {
                    $this->pdo->commit();
                    $result["status"] = true;
                }

                $result["data"] = $cards;
            } else {
                // debug([$cardNumber, "Не удалось зарегистрировать карту в SRC"]);
                echo("Не удалось зарегистрировать карты в SRC");
            }
        }

        return $result;
    }

    public function sheduler_changeDiscountSystem() {
        $operationResult = $this->initPDO();
        if ($operationResult["status"]) {
            $start = microtime(true);

            // Переключение системы лояльности
            $this->service_changeDiscountSystem();

            // Фиксация завершения обработки
            $cd = new DateTime();
            $this->journal("CRON", __FUNCTION__, json_encode(["startAt" => $cd->format('Y-m-d H:i:s'), "duration" => round(microtime(true) - $start, 4)], JSON_UNESCAPED_UNICODE), 1);
        }
    }

    public function service_changeDiscountSystem() {
        $result = $this->service_getAccountsToChangeDiscountSystem();
        if ($result["status"]) {
            $LMX = $this->getLMX();
            foreach ($result["data"] as $value) $this->service_changeAccountDiscountSystem($LMX, $value["id"], $value["ext_id"], $value["preferred_discount"]);
        }
    }

    public function service_getAccountsToChangeDiscountSystem($limit = 100) {
        $result = ["status" => false, "data" => null];

        $query = $this->pdo->prepare("SELECT
                a.id,
                a.preferred_discount,
                p.ext_id
            FROM
                accounts a
                LEFT JOIN profiles p
                ON a.id = p.account_id
            WHERE
                a.status = 1
                AND a.discount != a.preferred_discount
                AND NOT p.city IN ('Чегдомын', 'Новый Ургал', 'Николаевск на Амуре')
            LIMIT ?
        ");
        $query->execute([$limit]);
        $queryResult = $query->fetchAll();
        if (count($queryResult)) $result = [
            "status" => true,
            "data" => $queryResult
        ];

        return $result;
    }

    public function service_changeAccountDiscountSystem($LMX, $accountId, $personId, $preferredDiscount) {
        $result = ["status" => false];

        $setDiscountAttributeValue = $LMX->setDiscountAttributeValue($personId, boolval($preferredDiscount));
        if ($setDiscountAttributeValue["status"]) {
            $updateAccountResult = $this->updateAccount($accountId, ["discount" => $preferredDiscount]);
            if ($updateAccountResult["status"]) {
                $result["status"] = true;
            } else {
                $result = $updateAccountResult;
                $this->journal("CRON", __FUNCTION__, "", $updateAccountResult["status"], json_encode(["f" => "updateAccount", "a" => [$accountId, ["discount" => $preferredDiscount]]]), json_encode($updateAccountResult, JSON_UNESCAPED_UNICODE));   
            }
        } else {
            $result = $setDiscountAttributeValue;
            $this->journal("CRON", __FUNCTION__, "", $setDiscountAttributeValue["status"], json_encode(["f" => "LMX->setDiscountAttributeValue", "a" => [$personId, $preferredDiscount]]), json_encode($setDiscountAttributeValue, JSON_UNESCAPED_UNICODE));
        }

        return $result;
    }

    /* Прикладные ф-ии */

    // Хранение токенов Лоймакс
    //
    private function getLMX() {
        $getSAPITokenResult = $this->getSAPIToken();
        if ($getSAPITokenResult["status"]) {
            $LMX = new LMX($getSAPITokenResult["data"]);
        } else {
            $LMX = new LMX();
            $initSAPITokenResult = $LMX->initSAPIToken();
            if ($initSAPITokenResult["status"]) {
                $cd = new DateTime();
                $this->setSAPIToken(["SAPI_token" => $initSAPITokenResult["data"]->access_token, "SAPI_token_date" => $cd->format('Y-m-d H:i:s')]);
            }
        }

        return $LMX;
    }

    private function getSAPIToken() {
        $result = ["status" => false];

        $query = $this->pdo->prepare("SELECT
                s2.value AS token
            FROM
                settings s,
                settings s2
            WHERE
                s.setting = 'SAPI_token_date'
                AND DATE_ADD(s.value, INTERVAL 21 DAY) > NOW()
                AND s2.setting = 'SAPI_token'
        ");
        $query->execute();
        $queryResult = $query->fetchAll();
        if (count($queryResult)) {
            $result["status"] = true;
            $result["data"] = $queryResult[0]["token"];
        }

        return $result;
    }

    private function setSAPIToken($data) {
        // $data = ["SAPI_token" => "EXAMPLE", "SAPI_token_date" => "2021-11-22 17:15:00"];
        $result = ["status" => false];

        try {
            $begin = false;

            try { $this->pdo->beginTransaction(); $begin = true;} catch (\Throwable $th) {}
            foreach ($data as $key => $value) {
                if (in_array($key, ["SAPI_token", "SAPI_token_date"])) {
                    $query = $this->pdo->prepare("UPDATE settings SET value = ? WHERE setting = ?");
                    $query->execute([$value, $key]);

                    $result["status"] = true;
                } else {
                    $result["description"] = "Поле запрещено к редактированию.";
                }
            }
            if ($begin) try { $this->pdo->commit(); } catch (\Throwable $th) {}

            $result["status"] = true;
        } catch (\Throwable $th) {
            $result["description"] = $th->getMessage();
        }

        return $result;
    }
    //
    // Хранение токенов Лоймакс

    private function getUpdates($phone, $options = null) {
        // Подгрузим новости, магазины, профиль, номер карты и баланс
        // $options = [
        //     "personalHash"  => "",
        //     "walletHash"    => "",
        //     "storesHash"    => "",
        //     "lastNews"      => "",
        //     "lastPurchase"  => ""
        // ];

        $result = [
            "status" => true,
            "data" => [
                "personal"      => [],
                "personalHash"  => "",
                "stores"        => [],
                "storesHash"    => "",
                "wallet"        => [],
                "walletHash"    => "",
                "news"          => [],
                "purchases"     => []
                
            ]
        ];

        $fullAccountData = $this->getFullAccountDataByPhone($phone);
        if ($fullAccountData["status"]) {
            $personal = [
                "phone"                 => $phone,
                "discount"              => $fullAccountData["data"]["discount"],
                "discount_value"        => $fullAccountData["data"]["discount_value"],
                "preferred_discount"    => $fullAccountData["data"]["preferred_discount"],
                "sex"                   => $fullAccountData["data"]["sex"],
                "firstname"             => $fullAccountData["data"]["firstname"],
                "middlename"            => $fullAccountData["data"]["middlename"],
                "lastname"              => $fullAccountData["data"]["lastname"],
                "birthdate"             => $fullAccountData["data"]["birthdate"],
                "email"                 => $fullAccountData["data"]["email"],
                "city"                  => $fullAccountData["data"]["city"],
            ];
            $personalHash = hash("md5" ,implode("", $personal));
            if ($options["personalHash"] != $personalHash) {
                $result["data"]["personal"] = $personal;
                $result["data"]["personalHash"] = $personalHash;
            }

            $wallet = [
                "cardNumber"            => $fullAccountData["data"]["card_number"],
                "balance"               => $fullAccountData["data"]["balance"],
                "cardStatus"            => $fullAccountData["data"]["card_status"],
                "discount"              => $fullAccountData["data"]["discount"],
                "discountValue"         => $fullAccountData["data"]["discount_value"],
                "preferredDiscount"     => $fullAccountData["data"]["preferred_discount"],
                
            ];
            $walletHash = hash("md5", implode("", $wallet));
            if ($options["walletHash"] != $walletHash) {
                $result["data"]["wallet"] = $wallet;
                $result["data"]["walletHash"] = $walletHash;
            }

            $personId = $fullAccountData["data"]["ext_id"];
            if (!empty($personId)) {
                $getFullPurchasesDataByDateResult = $this->getFullPurchasesDataNew($personId, $options["lastPurchase"]);
                if ($getFullPurchasesDataByDateResult["status"]) {
                    $result["data"]["purchases"] = $getFullPurchasesDataByDateResult["data"];
                    $result["data"]["lastPurchase"] = $result["data"]["purchases"][count($result["data"]["purchases"]) - 1]["operation_date"];
                }
            }
        }

        $getNewsResult = $this->getNews($options["lastNews"]);
        if ($getNewsResult["status"]) $result["data"]["news"] = $getNewsResult["data"];

        $getStoresFullDataResult = $this->getStoresFullData();
        if ($getStoresFullDataResult["status"]) {
            $stores = $getStoresFullDataResult["data"];
            $storesHash = hash("md5" ,implode("", array_map(function($item) { return $item["rsa_id"]; }, $result["data"]["stores"])));
            if ($options["storesHash"] != $storesHash) {
                $result["data"]["stores"] = $stores;
                $result["data"]["storesHash"] = $storesHash;
            }
        }

        return $result;
    }

    private function getCities() {
        $result = ["status" => false, "data" => null];

        $query = $this->pdo->prepare("SELECT id, status, title, discount_value, default_discount FROM `cities` WHERE status > 0 ORDER BY title");
        $query->execute();
        $queryResult = $query->fetchAll();
        if (count($queryResult)) {
            $result["status"] = true;
            $result["data"] = $queryResult;
        }

        return $result;   
    }

    private function getCityById($id) {
        $result = ["status" => false, "data" => null];

        $query = $this->pdo->prepare("SELECT id, title, discount_value, default_discount FROM `cities` WHERE id = ?");
        $query->execute([$id]);
        $queryResult = $query->fetchAll();
        if (count($queryResult)) {
            $result["status"] = true;
            $result["data"] = $queryResult[0];
        }

        return $result;   
    }

    private function authByToken($token) {
        $result = ["status" => false, "description" => ""];

        $opResult = $this->checkToken($token);
        if ($opResult["status"]) {
            $accountToken = $opResult["data"]["token"];
            setcookie("token", $accountToken, strtotime('+12 month'));

            if ($opResult["data"]["qty"] != -1) $this->updateToken($opResult["data"]["id"], ["qty" => $opResult["data"]["qty"] - 1]);

            $result["status"] = true;
            $result["description"] = "Добро пожаловать!";
        }

        return $result;
    }

    private function addToken($accountId, $token = null, $qty = -1, $validityDays = 256) {
        $result = ["status" => false, "data" => null];

        $dt = new DateTime();
        $dt->add(new DateInterval('P'.$validityDays.'D'));
        $validity = $dt->format('Y-m-d H:i:s');

        if ($token == null) $token = bin2hex(random_bytes(16));

        try {
            $alias = $this->getLinkByToken($token);
            $query = $this->pdo->prepare("INSERT INTO tokens (account_id, token, qty, alias, validity) VALUES (?, ?, ?, ?, ?)");
            $query->execute([$accountId, $token, $qty, $alias, $validity]);

            $result = [
                "status" => true,
                "data" => [
                    "id" => $this->pdo->lastInsertId(),
                    "token" => $token,
                    "alias" => $alias,
                ]
            ];
        } catch (\Throwable $th) {
            $result["data"] = $th->getMessage();
        }

        return $result;
    }

    private function getLinkByToken($token){
        $customAlias = "https://".SITE_DOMAIN."/bd?tk=".$token;
        $generateAlias = @file_get_contents("http://tinyurl.com/api-create.php?url=https://".SITE_DOMAIN."/bd?tk=".$token);

        $alias = ($generateAlias) ? $generateAlias : $customAlias;

        return $alias;
    }

    private function addNotExistTokens(){
        set_time_limit(300);
        $query = $this->pdo->prepare("SELECT a.id FROM accounts a WHERE a.id NOT IN(SELECT account_id FROM tokens)");
        $query->execute();
        $queryResult = $query->fetchAll();

        if (count($queryResult)) {
            foreach ($queryResult as $accountId) {
                $this->addToken($accountId["id"]);
                break;
            }
        }
    }

    private function checkToken($token) {
        $result = ["status" => false, "data" => null];

        $query = $this->pdo->prepare("SELECT
                t.id,
                a.token,
                t.qty
            FROM
                tokens t
            LEFT JOIN accounts a ON
                t.account_id = a.id
            WHERE
                t.token = ? AND t.validity >= NOW() AND(t.qty > 0 OR t.qty = -1)
        ");
        $query->execute([$token]);
        $queryResult = $query->fetchAll();
        if (count($queryResult)) {
            $result = [
                "status" => true,
                "data" => $queryResult[0]
            ];
        }

        return $result;
    }

    private function updateToken($id, $data) {
        $result = ["status" => false, "description" => ""];

        if (empty($data)) {
            $result["description"] = "Массив свойств пуст.";
        } else {
            try {
                $begin = false;
                try { $this->pdo->beginTransaction(); $begin = true;} catch (\Throwable $th) {}
                foreach ($data as $key => $value) {
                    if (in_array($key, ["token", "qty", "validity"])) {
                        $query = $this->pdo->prepare("UPDATE tokens SET ".$key." = :value WHERE id = :id");
                        $query->execute(["value" => $value, "id" => $id]);

                        $result["status"] = true;
                    } else {
                        $result["description"] = "Поле запрещено к редактированию.";
                    }
                }
                if ($begin) try { $this->pdo->commit(); } catch (\Throwable $th) {}
            } catch (\Throwable $th) {
                $result["description"] = $th->getMessage();
            }
        }

        return $result;
    }

    private function getTokenByAccountId($accountId) {
        $result = ["status" => false, "data" => null];

        $query = $this->pdo->prepare("SELECT
                t.token,
                t.alias
            FROM
                tokens t
            WHERE
                t.account_id = ? AND t.validity >= NOW() AND(t.qty > 0 OR t.qty = -1)
        ");
        $query->execute([$accountId]);
        $queryResult = $query->fetchAll();
        if (count($queryResult)) {
            $result = [
                "status" => true,
                "data" => $queryResult[0]["token"],
                "alias" => $queryResult[0]["alias"],
            ];
        }

        return $result;
    }

    private function haveAccount($id) {
        $result = ["status" => false];

        $query = $this->pdo->prepare("SELECT id FROM accounts WHERE id = ?");
        $query->execute([$id]);
        $queryResult = $query->fetchAll();
        if (count($queryResult)) {
            $result["status"] = true;
        } else {
            $result["status"] = false;
        }

        return $result;
    }

    private function getNextProvider($lastProvider) {
        return $this->providers[array_search($lastProvider, $this->providers) == (count($this->providers) - 1) ? 0 : array_search($lastProvider, $this->providers) + 1];
    }

    private function canSendMessage($phone) {
        $result = ["status" => false, "data" => null];

        $query = $this->pdo->prepare("SELECT sent_at, provider FROM `messages` WHERE phone = :phone AND sent_at > DATE_ADD(NOW(), INTERVAL -5 MINUTE) ORDER BY sent_at DESC LIMIT 1");
        $query->execute(["phone" => $phone]);
        $queryResult = $query->fetchAll();
        if (count($queryResult)) {
            $cd = new DateTime();
            $cd_time = strtotime($cd->format('Y-m-d H:i:s'));
            $ls_time = strtotime($queryResult[0]["sent_at"]);
            if ($cd_time - MESSAGE_TIMEOUT_SECONDS > $ls_time) {
                $result = [
                    "status" => true,
                    "data" => [
                        "provider" => $queryResult[0]["provider"]
                    ]
                ];
            } else {
                $result["data"] = ["seconds_left" => MESSAGE_TIMEOUT_SECONDS - ($cd_time - $ls_time)];
            }
        } else {
            $result["status"] = true;
        }

        return $result;
    }

    private function sendMessage($phone, $message, $provider = null, $callback = false) {
        $result = NULL;

        if ($provider == null) $provider = DEFAULT_PROVIDER;

        switch ($provider) {
            default: {
                $result = ["status" => false, "description" => "UNDEFINED_PROVIDER"];
                break;
            }
            case "NT": {
                $result = $this->callPassword($phone, $message);
                break;
            }
            case "BEE": {
                $result = $this->sms($phone, $message, $callback);
                break;
            }
            case "DIG": {
                $result = $this->sendMessageDig($phone, $message);
                break;
            }
            case "DIG_FC": {
                $result = $this->sendMessageDig($phone, $message, "FLASHCALL");
                break;
            }
        }

        if ($result["status"]) {
            $sentAt = new Datetime();

            $query = $this->pdo->prepare("INSERT INTO messages (ext_id, provider, phone, message, sent_at, status) VALUES (?, ?, ?, ?, ?, ?)");
            $query->execute([
                $result["data"]["ext_id"],
                $provider,
                $phone,
                $message,
                $sentAt->format("Y-m-d H:i:s"),
                (isset($result["data"]["status"]) ? $result["data"]["status"] : null)
            ]);
        } else {
            $this->journal("APP", "sendMessage", $phone . ", " . $message . ", ". $provider, $result["status"]);
        }

        return $result;
    }

    private function getFullAccountDataByToken($token) {
        $result = ["status" => false, "data" => null];

        $query = $this->pdo->prepare("SELECT 
                T1.id,
                T1.status AS account_status,
                T1.discount,
                T1.discount_value,
                T1.preferred_discount,
                T2.ext_id,
                T2.sex,
                T2.firstname,
                T2.middlename,
                T2.lastname,
                T2.birthdate,
                T2.email,
                T2.last_sync AS profile_last_sync,
                b.card_number,
                b.balance,
                b.status AS card_status,
                b.last_sync AS card_last_sync,
                IFNULL(MAX(p.sale_time), '2021-01-01 00:00:00') AS last_purchase
            FROM
                accounts AS T1
                LEFT JOIN profiles AS T2 ON T1.id = T2.account_id
                LEFT JOIN bonuscards AS b ON T1.id = b.account_id
                LEFT JOIN purchases AS p ON T2.ext_id = p.profile_ext_id
            WHERE
                T1.token = :token
                AND b.status = 1
            GROUP BY
                T1.id,
                T1.status,
                T1.discount,
                T1.discount_value,
                T1.preferred_discount,
                T2.ext_id,
                T2.sex,
                T2.firstname,
                T2.middlename,
                T2.lastname,
                T2.birthdate,
                T2.email,
                T2.last_sync,
                b.card_number,
                b.balance,
                b.status,
                b.last_sync
        ");
        $query->execute(["token" => $token]);
        $queryResult = $query->fetchAll();
        if (count($queryResult)) {
            $result["status"] = true;
            $result["data"] = $queryResult[0];
        }

        return $result;
    }

    private function getFullAccountDataByPhone($phone) {
        $result = ["status" => false, "data" => null];

        $query = $this->pdo->prepare("SELECT 
                a.id,
                a.discount,
                a.discount_value,
                a.preferred_discount,
                p.ext_id,
                p.sex,
                p.firstname,
                p.middlename,
                p.lastname,
                p.birthdate,
                p.email,
                p.city,
                b.card_number,
                ROUND(b.balance / 100, 2) AS balance,
                b.status AS card_status
            FROM
                accounts AS a
                LEFT JOIN profiles AS p ON a.id = p.account_id
                LEFT JOIN bonuscards AS b ON a.id = b.account_id
            WHERE
                a.phone = ?
        ");
        $query->execute([$phone]);
        $queryResult = $query->fetchAll();
        if (count($queryResult)) {
            $result["status"] = true;
            $result["data"] = $queryResult[0];
        }

        return $result;
    }

    private function getAccountDataByPhone($phone) {
        $result = ["status" => false, "data" => null];

        $query = $this->pdo->prepare("SELECT 
            *
            FROM accounts
            WHERE phone = :phone
        ");
        $query->execute(["phone" => $phone]);
        $queryResult = $query->fetchAll();
        if (count($queryResult)) {
            $result["status"] = true;
            $result["data"] = $queryResult[0];
        }

        return $result;
    }

    private function checkAuthorization($journal = "", $source = "unknown") {
        $result = ["status" => false];

        $cookieToken = "";
        $bearerToken = "";

        if (isset($_COOKIE["token"])) $cookieToken = $_COOKIE["token"];
        $operationResult = $this->getBearerToken();
        if ($operationResult["status"]) $bearerToken = $operationResult["data"];

        if (!empty($cookieToken) || !empty($bearerToken)) {
            $token = "";

            if (!empty($cookieToken)) $token = $cookieToken;
            if (!empty($bearerToken)) $token = $bearerToken;

            $query = $this->pdo->prepare("SELECT
                    T1.id,
                    T1.phone,
                    T1.token,
                    T2.firstname,
                    T2.middlename,
                    T2.ext_id AS personId,
                    b.card_number,
                    b.last_sync AS bonusCardLastSync
                FROM
                    accounts AS T1
                    LEFT JOIN profiles AS T2
                        ON T1.id = T2.account_id
                    LEFT JOIN bonuscards b
                        ON T1.id = b.account_id
                WHERE
                    T1.token = :token
                    AND T1.status != 0
            ");
            $query->execute(["token" => $token]);
            $queryResult = $query->fetchAll();
            if (count($queryResult)) {
                $result["status"] = true;
                $result["data"] = $queryResult[0];
            } else {
                $result["description"] = "Пользователь не подтвердил номер телефона.";

                if ($journal) {
                    $input = [
                        "header" => getallheaders(),
                        "post" => $_POST,
                        "json" => file_get_contents('php://input')
                    ];
                    
                    $this->journal("APP", $journal, $source, false, json_encode($input), json_encode($result, JSON_UNESCAPED_UNICODE));
                }
            }
        } else {
            $result["description"] = "Пользователь не авторизован.";
        }

        return $result;
    }

    public function getBearerToken() {
        $result = ["status" => false];

        $headersList = getallheaders();
        $headersListLowerCase = [];
        foreach ($headersList as $key => $value) $headersListLowerCase[strtolower($key)] = $value;
        if (isset($headersListLowerCase["authorization"])) {
            $token = explode("Bearer ", $headersListLowerCase["authorization"])[1];
            if (!empty($token)) {
                $result["status"] = true;
                $result["data"] = $token;
            }
        }

        return $result;
    }

    private function canSendConfirmationCode($phone) {
        $result = ["status" => false, "data" => null];

        $query = $this->pdo->prepare("SELECT sent_at, provider FROM `confirmations` WHERE phone = :phone AND sent_at > DATE_ADD(NOW(), INTERVAL -5 MINUTE) ORDER BY sent_at DESC LIMIT 1");
        $query->execute(["phone" => $phone]);
        $queryResult = $query->fetchAll();
        if (count($queryResult)) {
            $cd = new DateTime();
            $cd_time = strtotime($cd->format('Y-m-d H:i:s'));
            $ls_time = strtotime($queryResult[0]["sent_at"]);
            if ($cd_time - MESSAGE_TIMEOUT_SECONDS > $ls_time) {
                $result = [
                    "status" => true,
                    "data" => [
                        "provider" => $queryResult[0]["provider"]
                    ]
                ];
            } else {
                $result["data"] = ["seconds_left" => MESSAGE_TIMEOUT_SECONDS - ($cd_time - $ls_time)];
            }
        } else {
            $result["status"] = true;
        }

        return $result;
    }

    private function sendConfirmationCode($phone, $provider = null) {
        $result = ["status" => false, "description" => ""];

        $confirmation_code = "";
        $chars = '1234567890';
        $numChars = strlen($chars);
        for ($i = 0; $i < 4; $i++) { $confirmation_code .= substr($chars, rand(1, $numChars) - 1, 1); }

        if ($provider == null) $provider = DEFAULT_PROVIDER;

        $description = "";

        switch ($provider) {
            case "BEE": {
                $result = $this->sms($phone, 'Код подтверждения: ' . $confirmation_code, true);
                $description = "Введите код из СМС.";
                break;
            }

            case "NT": {
                $result = $this->callPassword($phone, $confirmation_code);
                $description = "Введите четыре последние цифры номера телефона входящего звонка.";
                break;
            }

            case "DIG": {
                $result = $this->sendMessageDig($phone, $confirmation_code);
                $description = "Введите код из СМС.";
                break;
            }
            case "DIG_FC": {
                $result = $this->sendMessageDig($phone, $confirmation_code, "FLASHCALL");
                $description = "Введите четыре последние цифры номера телефона входящего звонка.";
                break;
            }
        }

        if ($result["status"]) {
            $query = $this->pdo->prepare("INSERT INTO confirmations (ext_id, provider, phone, code, sent_at, status) VALUES (?, ?, ?, ?, NOW(), ?)");
            $query->execute([$result["data"]["ext_id"], $provider, $phone, $confirmation_code, (isset($result["data"]["status"]) ? $result["data"]["status"] : null)]);

            $result = [
                "status" => true,
                "description" => $description . (API_DEBUG ? " [".$confirmation_code."]" : ""),
                "data" => [
                    "need_confirmation" => true,
                    "seconds_left" => MESSAGE_TIMEOUT_SECONDS
                ]
            ];
        } else {
            $this->journal("APP", "sendConfirmationCode", $phone . "/" . $confirmation_code . "/". $provider, $result["status"]);
            $result["description"] = "Не удалось отправить код подтверждения, попробуйте позже.";
        }

        return $result;
    }

    private function checkConfirmationCode($phone, $code) {
        $result = ["status" => false, "description" => ""];

        // Если код указан
        $query = $this->pdo->prepare("SELECT code, attempts, sent_at, (NOW() - sent_at) > 500 AS outdate from confirmations WHERE phone = ? and sent_at IN (SELECT MAX(sent_at) AS LastSent FROM confirmations WHERE phone = ?)");
        $query->execute([$phone, $phone]);
        $queryResult = $query->fetchAll();
        if (count($queryResult)) {
            // Проверим время и попытки ввода
            if ($queryResult[0]["outdate"] or intval($queryResult[0]["attempts"]) <= 0) {
                // Код устарел, или закончились попытки ввода
                $result["description"] = "Запросите новый код";
            } else {
                // Введен правильный код
                if ($queryResult[0]["code"] == $code) {
                    $result["status"] = true;
                } else {
                    // Код не подходит
                    $newAttempts = $queryResult[0]["attempts"] - 1;

                    $query = $this->pdo->prepare("UPDATE confirmations SET attempts = :new_attempts WHERE phone = :phone AND sent_at = :sent_at");
                    $query->execute(["phone" => $phone, "new_attempts" => $newAttempts, "sent_at" => $queryResult[0]["sent_at"]]);

                    $result = ["status" => false, "description" => "Код введен неправильно" , "data" => ["need_confirmation" => true]];
                }
            }
        } else {
            // На указанный номер не высылались коды
            $result = ["status" => false, "description" => "Код введен неправильно", "data" => ["need_confirmation" => true]];
        }

        return $result;
    }

    public function registration($phone, $pass, $discount = 0, $discountValue = 0, $preferredDiscount = 0) {
        if (!$phone) return ["status" => 0, "description" => "Не указан логин!"];
        if (mb_strlen($phone, "UTF-8") < 6) return ["status" => 0, "description" => "Логин должен содержать не менее 6 символов."];
        if (!$pass) return ["status" => 0, "description" => "Не указан пароль!"];
        if (mb_strlen($pass, "UTF-8") < 6) return ["status" => 0, "description" => "Пароль должен содержать не менее 6 символов."];
        if ($this->checkPhone($phone)) return ["status" => 1, "description" => "Логин используется."];

        $token = bin2hex(random_bytes(32));

        $pwdShitted = hash_hmac("sha256", $pass, SOMESHIT);
        $pwd = password_hash($pwdShitted, PASSWORD_DEFAULT);

        $query = $this->pdo->prepare("INSERT INTO
            accounts (phone, pass, token, discount, discount_value, preferred_discount)
            VALUES (:phone, :pwd, :token, :discount, :discount_value, :preferred_discount)
        ");
        $query->execute([
            "phone" => $phone,
            "pwd" => $pwd,
            "token" => $token,
            "discount" => $discount,
            "discount_value" => $discountValue,
            "preferred_discount" => $preferredDiscount
        ]);
        $accountId = $this->pdo->lastInsertId();

        if (isset($accountId) && !empty($accountId)) {
            $opResult = $this->addToken($accountId);
            $token = ($opResult["status"]) ? $opResult["data"]["token"] : "";

            return ["status" => 1, "description" => "Вы успешно зарегистрировались.", "data" => [
                "account_id" => $accountId,
                "token" => $token
            ]];
        } else {
            return ["status" => 0, "description" => "Регистрация не завершена."];
        }
    }

    public function updateAccount($account_id, $data) {
        $result = ["status" => false];

        try {
            $inTransaction = $this->pdo->inTransaction();
            if (!$inTransaction) $this->pdo->beginTransaction();
            foreach ($data as $key => $value) {
                $query = $this->pdo->prepare("UPDATE accounts SET ".$key." = ? WHERE id = ?");
                $query->execute([$value, $account_id]);
            }
            if (!$inTransaction) $this->pdo->commit();
            $result["status"] = true;
        } catch (Throwable $th) {
            $result["data"] = $th->getMessage();
        }

        return $result;
    }

    public function getReferLink($account_id) {
        $result = ["status" => false, "data" => ["link" => null, "referrals" => null, "description" => ""]];

        $result["status"] = true;
        $result["data"]["link"] = "https://bonus.stolica-dv.ru/ref?id=" . $account_id;

        try {
            $query = $this->pdo->prepare("SELECT
                r.account_id,
                r.gifted,
                SUBSTRING(a.phone, -4) AS phone,
                DATE_FORMAT(p.last_sync, '%d.%m.%y') AS last_sync,
                ROUND(s.value / 100, 2) AS referral_gift
            FROM 
                referrals r
                INNER JOIN accounts a ON r.account_id = a.id
                INNER JOIN profiles p ON r.account_id = p.account_id,
                settings s
            WHERE
                s.setting = 'referral_gift'
                AND ref_account_id = ?
            ORDER BY
                p.last_sync");
            $query->execute([$account_id]);

            $queryResult = $query->fetchAll();
            if (count($queryResult)) $result["data"]["referrals"] = $queryResult;
        } catch (\Throwable $th) {
            $result["data"]["description"] = $th->getMessage();
        }

        return $result;
    }

    public function checkPhone($phone) {
        $query = $this->pdo->prepare("SELECT
            phone FROM accounts WHERE phone = ? AND status != 0
        ");
        $query->execute([$phone]);
        $queryResult = $query->fetchAll();
        if (count($queryResult)) {
            return 1;
        } else {
            return 0;
        }
    }

    public function checkPassword($phone, $pass) {
        $result = ["status" => false, "data" => null];

        $query = $this->pdo->prepare("SELECT token, pass FROM accounts WHERE phone = :phone AND status != 0");
        $query->execute(["phone" => $phone]);
        $queryResult = $query->fetchAll();
        if (count($queryResult)) if (password_verify(hash_hmac("sha256", $pass, SOMESHIT), $queryResult[0]["pass"])) $result = ["status" => true, "data" => $queryResult[0]["token"]];

        return $result;
    }

    public function changePassword($phone, $oldPassword, $newPassword) {
        $result = ["status" => false];

        $result = $this->checkPassword($phone, $oldPassword);
        if ($result["status"]) {
            if (mb_strlen($newPassword, "UTF-8") >= 6) {
                $pwdShitted = hash_hmac("sha256", $newPassword, SOMESHIT);
                $pwd = password_hash($pwdShitted, PASSWORD_DEFAULT);

                $query = $this->pdo->prepare("UPDATE accounts SET pass = :pwd WHERE token = :token");
                $query->execute(["pwd" => $pwd, "token" => $result["data"]]);

                $result = ["status" => true, "description" => "Новый пароль сохранен."];
            } else {
                $result = ["status" => false, "description" => "Пароль должен содержать не менее 6 символов."];
            }
        } else {
            $result = ["status" => false, "description" => "Неверное имя пользователя или пароль."];
        }

        return $result;
    }

    private function setNewPassword($phone, $newPassword) {
        $result = ["status" => false];

        if (mb_strlen($newPassword, "UTF-8") >= 6) {
            $pwdShitted = hash_hmac("sha256", $newPassword, SOMESHIT);
            $pwd = password_hash($pwdShitted, PASSWORD_DEFAULT);

            $query = $this->pdo->prepare("UPDATE accounts SET pass = :pwd WHERE phone = :phone");
            $query->execute(["pwd" => $pwd, "phone" => $phone]);

            $result = ["status" => true, "description" => "Новый пароль сохранен."];
        } else {
            $result = ["status" => false, "description" => "Пароль должен содержать не менее 6 символов."];
        }

        return $result;
    }

    private function changeCardType($phone, $discount) {
        $query = $this->pdo->prepare("UPDATE accounts SET preferred_discount = :discount WHERE phone = :phone");
        $query->execute(["discount" => $discount, "phone" => $phone]);

        $result = ["status" => true, "description" => "Тип карты изменен."];

        $this->journal("APP", __FUNCTION__, "", true, json_encode(["f" => "changeCardType", "a" => [$phone, $discount]]), json_encode($result, JSON_UNESCAPED_UNICODE));

        return $result;
    }

    private function logOff() {
        $result = ["status" => false];

        try {
            setcookie("token", null, strtotime('-1 days'));
            $result["status"] = true;
        } catch (\Throwable $th) {
            $result = ["status" => false, "data" => $th->getMessage()];
        }

        return $result;
    }

    private function getProfileDataByPhone($phone) {
        $result = ["status" => false, "data" => null];

        $query = $this->pdo->prepare("SELECT
                a.discount,
                a.discount_value,
                a.preferred_discount,
                a.phone,
                a.id as account_id,
                p.ext_id,
                p.firstname,
                p.middlename,
                p.lastname,
                p.sex,
                p.email,
                p.birthdate,
                p.city,
                p.last_sync,
                b.card_number,
                b.status AS card_status
            FROM
                profiles p
                LEFT JOIN bonuscards b
                ON p.account_id = b.account_id AND b.status = 1
                LEFT JOIN accounts a
                    ON p.account_id = a.id
            WHERE
                p.account_id IN(
                SELECT
                    id
                FROM
                    accounts
                WHERE
                    phone = ?
            )
        ");
        $query->execute([$phone]);
        $queryResult = $query->fetchAll();
        if (count($queryResult)) {
            $result["status"] = true;
            $result["data"] = $queryResult[0];
        }

        return $result;
    }

    private function setProfileDataByPhone($phone, $accountData) {
        $result = ["status" => false, "description" => ""];

        if (!count($accountData)) return $result;

        try {
            $query = $this->pdo->prepare("SELECT id FROM profiles WHERE account_id IN (SELECT id FROM accounts WHERE phone = ?)");
            $query->execute([$phone]);
            $queryResult = $query->fetchAll();
            if (count($queryResult)) {
                $this->pdo->beginTransaction();
                foreach ($accountData as $key => $value) {
                    if (in_array($key, ["ext_id", "firstname", "middlename", "lastname", "email", "sex", "birthdate", "city", "last_sync", "last_cong"])) {
                        $query = $this->pdo->prepare("UPDATE profiles SET ".$key." = :value WHERE account_id IN (SELECT id FROM accounts WHERE phone = :phone)");
                        $query->execute(["value" => $value, "phone" => $phone]);

                        $result["status"] = true;
                    }
                }
                $this->pdo->commit();
            } else {
                $cd = new DateTime();

                $query = $this->pdo->prepare("INSERT INTO profiles (account_id, firstname, middlename, lastname, email, sex, birthdate, city, last_sync) VALUES (
                    (SELECT id FROM accounts WHERE phone = :phone),
                    :firstname,
                    :middlename,
                    :lastname,
                    :email,
                    :sex,
                    :birthdate,
                    :city,
                    :last_sync
                )");
                $query->execute([
                    "phone" => $phone,
                    "firstname" => (isset($accountData["firstname"]) ? $accountData["firstname"] : ""),
                    "middlename" => (isset($accountData["middlename"]) ? $accountData["middlename"] : ""),
                    "lastname" => (isset($accountData["lastname"]) ? $accountData["lastname"] : ""),
                    "email" => (isset($accountData["email"]) ? $accountData["email"] : ""),
                    "sex" => (isset($accountData["sex"]) ? $accountData["sex"] : "0"),
                    "birthdate" => (isset($accountData["birthdate"]) ? $accountData["birthdate"] : null),
                    "city" => (isset($accountData["city"]) ? $accountData["city"] : ""),
                    "last_sync" => $cd->format('Y-m-d H:i:s')
                ]);
                $result["status"] = true;
            }
        } catch (\Throwable $th) {
            $result["description"] = $th->getMessage();
        }

        return $result;
    }

    private function addBonusCard($phone, $cardNumber) {
        $result = ["status" => false];

        try {
            $query = $this->pdo->prepare("INSERT INTO bonuscards (account_id, card_number, last_sync, status, type) VALUES (
                    (SELECT id FROM accounts WHERE phone = :phone),
                    :cardNumber,
                    '2021-10-02',
                    1,
                    0
                )");
            $query->execute(["phone" => $phone, "cardNumber" => $cardNumber]);

            $result = [
                "status" => true,
                "data" => [
                    "bonuscard_id" => $this->pdo->lastInsertId()
                ]
            ];
        } catch (\Throwable $th) {
            $result["data"] = $th->getMessage();
        }

        return $result;
    }

    private function getBonusCardData($cardNumber) {
        $result = ["status" => false, "data" => null];

        $query = $this->pdo->prepare("SELECT b.*, a.phone FROM bonuscards b LEFT JOIN accounts a ON b.account_id = a.id WHERE b.card_number = :cardNumber");
        $query->execute(["cardNumber" => $cardNumber]);
        $queryResult = $query->fetchAll();
        if (count($queryResult)) {
            $result["status"] = true;
            $result["data"] = $queryResult[0];
        }

        return $result;
    }

    private function setBonusCardData($cardNumber, $bonusCardData) {
        $result = ["status" => false, "data" => null];

        $begin = false;
        try { $this->pdo->beginTransaction(); $begin = true;} catch (\Throwable $th) {}
        foreach ($bonusCardData as $key => $value) {
            if (in_array($key, ["balance", "status", "last_sync", "account_id"])) {
                $query = $this->pdo->prepare("UPDATE bonuscards SET ".$key." = :value WHERE card_number = :cardNumber");
                $query->execute(["value" => $value, "cardNumber" => $cardNumber]);

                $result["status"] = true;
            } else {
                $result["description"] = "Поле запрещено к редактированию.";
            }
        }
        if ($begin) try { $this->pdo->commit(); } catch (\Throwable $th) {}

        return $result;
    }

    private function addTransaction($cardNumber, $transactionData) {
        $result = ["status" => false, "data" => null];

        $query = $this->pdo->prepare("INSERT INTO transactions (ext_id, amount, type, operation_date, start_date, finish_date, rsa_id, cash, shift, number, bonuscard_id) VALUES (
                :ext_id,
                :amount,
                :type,
                :operation_date,
                :start_date,
                :finish_date,
                :rsa_id,
                :cash,
                :shift,
                :number,
                (SELECT id FROM bonuscards WHERE card_number = :cardNumber)
            )");
        $query->execute([
            "ext_id" => $transactionData["ext_id"],
            "type" => $transactionData["type"],
            "amount" => $transactionData["amount"],
            "operation_date" => $transactionData["operation_date"],
            "start_date" => $transactionData["start_date"],
            "finish_date" => $transactionData["finish_date"],
            "rsa_id" => $transactionData["rsa_id"],
            "cash" => $transactionData["cash"],
            "shift" => $transactionData["shift"],
            "number" => $transactionData["number"],
            "cardNumber" => $cardNumber
        ]);

        $result["status"] = true;

        return $result;
    }

    private function getTransactionsIds($cardNumber) {
        $result = ["status" => false, "data" => null];

        $query = $this->pdo->prepare("SELECT 
                    transactions.ext_id
                FROM transactions
                WHERE
                    bonuscard_id IN (SELECT id FROM bonuscards WHERE card_number = :cardNumber)
                    AND type IN ('" . implode("','", SRC::$transactionTypes) . "')"
        );
        $query->execute(["cardNumber" => $cardNumber]);
        $queryResult = $query->fetchAll();
        if (count($queryResult)) {
            $result["status"] = true;
            $result["data"] = $queryResult;
        }
        return $result;
    }

    private function updateCardData($cardNumber, $lastSync) {
        $result = ["status" => false, "data" => null];

        $cd = new DateTime();
        $lsd = new DateTime($lastSync);

        $syncResult = SRC::getBonusAccountBalances($cardNumber);
        if ($syncResult["status"]) {
            $newCardBalance = $syncResult["data"]["active"];

            $this->pdo->beginTransaction();
            $transactionsRequest = SRC::getBonusAccountHistory($cardNumber, $lsd->format("Y-m-d"), $cd->format("Y-m-d"));
            if ($transactionsRequest["status"] && count($transactionsRequest["data"])) {
                $transactions = $this->getTransactionsIds($cardNumber);
                $extIds = [];
                if (isset($transactions["data"]) && count($transactions["data"])) $extIds = array_map(function($transaction) { return $transaction["ext_id"]; }, $transactions["data"]);

                foreach ($transactionsRequest["data"] as $value) if (!in_array($value["ext_id"], $extIds)) $this->addTransaction($cardNumber, $value);
            }

            $setBonusCardDataResult = $this->setBonusCardData($cardNumber, ["last_sync" => $cd->format('Y-m-d H:i:s'), "balance" => $newCardBalance]);
            if ($setBonusCardDataResult["status"]) {
                $this->pdo->commit();
            } else {
                $this->pdo->rollback();
            }

            $result["status"] = true;
            $result["data"] = [
                "last_sync" => $cd->format('Y-m-d H:i:s')
            ];
        }

        return $result;
    }

    private function addPurchase($purchase, $rsa_id, $person_id = null) {
        $result = ["status" => false];

        try {
            $inTransaction = $this->pdo->inTransaction();
            if (!$inTransaction) $this->pdo->beginTransaction();

            $sale_time = new DateTime($purchase["sale_time"]);
            $oper_day = new DateTime($purchase["oper_day"]);

            $query = $this->pdo->prepare("INSERT INTO purchases (
                    hash,
                    rsa_id, 
                    operation_type, 
                    oper_day, 
                    cash, 
                    shift, 
                    number, 
                    sale_time, 
                    amount,
                    cashback_amount,
                    profile_ext_id,
                    discount_amount,
                    payment_amount, 
                    discount_card
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $a = [
                md5($rsa_id . $purchase["sale_time"] . $purchase["number"]),
                $rsa_id,
                $purchase["operation_type"],
                $oper_day->format("Y-m-d"),
                $purchase["cash"],
                $purchase["shift"],
                $purchase["number"],
                $sale_time->format("Y-m-d H:i:s"),
                $purchase["amount"],
                $purchase["cashback_amount"],
                $person_id,
                $purchase["discount_amount"],
                $purchase["payment_amount"],
                $purchase["discount_card"]
            ];
            $query->execute($a);

            $purchase_id = $this->pdo->lastInsertId();
            foreach ($purchase["positions"] as $position) {
                $query = $this->pdo->prepare("INSERT INTO positions (
                        purchase_id,
                        product_id,
                        title,
                        count,
                        cost,
                        cashback_amount,
                        discount_amount,
                        payment_amount,
                        amount
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $a = [
                    $purchase_id,
                    $position["product_id"],
                    $position["title"],
                    $position["count"],
                    $position["cost"],
                    $position["cashback_amount"],
                    $position["discount_amount"],
                    $position["payment_amount"],
                    $position["amount"]
                ];
                // debug($a);
                $query->execute($a);
            }

            if (!$inTransaction) $this->pdo->commit();

            $result = [
                "status" => true,
                "data" => $purchase_id
            ];
        } catch (\Throwable $th) {
            $result["data"] = $th->getMessage();
        }

        return $result;
    }

    private function updatePurchase($purchaseId, $data) {
        $result = ["status" => false, "data" => null];

        $begin = false;
        try { $this->pdo->beginTransaction(); $begin = true;} catch (\Throwable $th) {}
        try {
            foreach ($data as $key => $value) {
                if (in_array($key, ["processing_completed"])) {
                    $query = $this->pdo->prepare("UPDATE purchases SET ".$key." = :value WHERE id = :purchaseId");
                    $query->execute(["value" => $value, "purchaseId" => $purchaseId]);

                    $result["status"] = true;
                } else {
                    $result["description"] = "Поле запрещено к редактированию.";
                }
            }

            if ($begin) try { $this->pdo->commit(); } catch (\Throwable $th) {}
        } catch (\Throwable $th) {
            $result["description"] = $th->getMessage();
        }

        debug($result);

        return $result;
    }

    private function getPurchases($date, $rsa_id) {
        $result = ["status" => false];

        $query = $this->pdo->prepare("SELECT purchases.cash, purchases.shift, purchases.number FROM purchases WHERE rsa_id = ? AND oper_day = ?");
        $query->execute([$rsa_id, $date]);
        $queryResult = $query->fetchAll();
        if (count($queryResult)) {
            $result = [
                "status" => true,
                "data" => $queryResult
            ];
        }

        return $result;
    }

    private function getPurchasesHash($personId) {
        $result = ["status" => false];

        $query = $this->pdo->prepare("SELECT
                hash,
                rsa_id,
                sale_time,
                number
            FROM
                purchases
            WHERE
                profile_ext_id = ?
        ");
        $query->execute([$personId]);
        $queryResult = $query->fetchAll();
        if (count($queryResult)) {
            $purchasesHash = [];
            foreach ($queryResult as $purchase) array_push($purchasesHash, (!empty($purchase["hash"]) ? $purchase["hash"] : md5($purchase["rsa_id"] . $purchase["sale_time"] . $purchase["number"])));
        
            $result = [
                "status" => true,
                "data" => $purchasesHash
            ];
        }

        return $result;
    }
    
    private function getLastPurchase($personId) {
        $result = ["status" => false];
        
        $query = $this->pdo->prepare("SELECT
                *
            FROM
                purchases
            WHERE
                purchases.profile_ext_id = ?
            ORDER BY
                sale_time DESC
            LIMIT 1
        ");
        $query->execute([$personId]);
        $queryResult = $query->fetchAll();
        if (count($queryResult)) {
            $result = [
                "status" => true,
                "data" => $queryResult[0]
            ];
        }

        return $result;
    }

    private function getFullPurchasesDataNew($personId, $lastPurchaseDate = "2021-01-01 00:00:00", $limit = 50) {
        $result = ["status" => false, "data" => []];

        $query = $this->pdo->prepare("SELECT
                id
            FROM
                purchases
            WHERE
                profile_ext_id = ? AND sale_time > ?
            ORDER BY
                sale_time DESC
            LIMIT ?
        ");
        $query->execute([$personId, $lastPurchaseDate, $limit]);
        $queryResult = $query->fetchAll();
        if (count($queryResult)) {
            $purchasesId = [];
            foreach ($queryResult as $key => $row) array_push($purchasesId, $row["id"]);

            $query = $this->pdo->prepare("SELECT
                    purchases.sale_time AS operation_date,
                    purchases.operation_type AS operation_type,
                    stores.title AS store_title,
                    stores.description AS store_description,
                    purchases.id,
                    ROUND(purchases.amount / 100, 2) AS purchase_amount,
                    ROUND(purchases.cashback_amount / 100, 2) AS purchase_cashback_amount,
                    CASE
                        WHEN purchases.profile_ext_id IS NULL THEN 0
                        ELSE ROUND(purchases.discount_amount / 100, 2)
                    END AS purchase_discount_amount,
                    CASE
                        WHEN purchases.profile_ext_id IS NULL THEN -ROUND(purchases.discount_amount / 100, 2)
                        ELSE ROUND(purchases.payment_amount / 100, 2)
                    END AS purchase_payment_amount,
                    positions.title AS product_title,
                    (positions.cost / 100) cost,
                    ROUND(positions.cashback_amount / 100, 2) AS cashback_amount,
                    CASE
                        WHEN purchases.profile_ext_id IS NULL THEN 0
                        ELSE ROUND(positions.discount_amount / 100, 2)
                    END AS discount_amount,
                    CASE
                        WHEN purchases.profile_ext_id IS NULL THEN -ROUND(positions.discount_amount / 100, 2)
                        ELSE ROUND(positions.payment_amount / 100, 2)
                    END AS payment_amount,
                    ROUND(positions.amount / 100, 2) AS amount
                FROM purchases
                LEFT JOIN positions
                    ON purchases.id = positions.purchase_id
                LEFT JOIN stores
                    ON purchases.rsa_id = stores.rsa_id
                WHERE
                    purchases.id IN (" . join(",", $purchasesId) . ")
                ORDER BY
                    purchases.sale_time DESC   
            ");
            $query->execute();
            $queryResult = $query->fetchAll();
            if (count($queryResult)) {
                $lastPositionId = null;
                $purchases = [];
                $positions = [];

                foreach ($queryResult as $row) {
                    if (!$lastPositionId || $lastPositionId != $row["id"]) {
                        array_push($purchases, [
                            "id"                => $row["id"],
                            "operation_date"    => $row["operation_date"],
                            "operation_type"    => $row["operation_type"],
                            "store_title"       => $row["store_title"],
                            "store_description" => $row["store_description"],
                            "amount"            => $row["purchase_amount"],
                            "cashback_amount"   => $row["purchase_cashback_amount"],
                            "discount_amount"   => $row["purchase_discount_amount"],
                            "payment_amount"    => $row["purchase_payment_amount"],
                            "positions"         => []
                        ]);

                        $lastPositionId = $row["id"];
                    }

                    if ($row["product_title"] != null) {
                        array_push($positions, [
                            "purchase_id"       => $row["id"],
                            "product_title"     => $row["product_title"],
                            "cost"              => $row["cost"],
                            "cashback_amount"   => $row["cashback_amount"],
                            "discount_amount"   => $row["discount_amount"],
                            "payment_amount"    => $row["payment_amount"],
                            "amount"            => $row["amount"]
                        ]);
                    }
                }

                foreach ($purchases as $key => $purchase) {
                    foreach ($positions as $key => $position) if ($purchase["id"] == $position["purchase_id"]) array_push($purchase["positions"], $position);
                    array_push($result["data"], $purchase);
                }
                
                usort($result["data"], function($a, $b) { return $a["operation_date"] > $b["operation_date"];});
                
                $result["status"] = true;
            }
        } else {
            $result["data"] = 'Чеки отсутствуют';
        }

        return $result;
    }

    private function getFullPurchasesData($personId, $limit = 50) {
        $result = ["status" => false, "data" => []];

        $query = $this->pdo->prepare("SELECT
                id
            FROM
                purchases
            WHERE
                purchases.profile_ext_id = ?
            ORDER BY
                sale_time DESC
            LIMIT ?
        ");
        $query->execute([$personId, $limit]);
        $queryResult = $query->fetchAll();
        if (count($queryResult)) {
            $purchasesId = [];
            foreach ($queryResult as $key => $row) array_push($purchasesId, $row["id"]);

            $query = $this->pdo->prepare("SELECT
                    purchases.sale_time AS operation_date,
                    stores.title AS store_title,
                    stores.description AS store_description,
                    purchases.id,
                    ROUND(purchases.amount / 100, 2) AS purchase_amount,
                    ROUND(purchases.cashback_amount / 100, 2) AS purchase_cashback_amount,
                    CASE
                        WHEN purchases.profile_ext_id IS NULL THEN 0
                        ELSE ROUND(purchases.discount_amount / 100, 2)
                    END AS purchase_discount_amount,
                    CASE
                        WHEN purchases.profile_ext_id IS NULL THEN -ROUND(purchases.discount_amount / 100, 2)
                        ELSE ROUND(purchases.payment_amount / 100, 2)
                    END AS purchase_payment_amount,
                    positions.title AS product_title,
                    (positions.cost / 100) cost,
                    ROUND(positions.cashback_amount / 100, 2) AS cashback_amount,
                    CASE
                        WHEN purchases.profile_ext_id IS NULL THEN 0
                        ELSE ROUND(positions.discount_amount / 100, 2)
                    END AS discount_amount,
                    CASE
                        WHEN purchases.profile_ext_id IS NULL THEN -ROUND(positions.discount_amount / 100, 2)
                        ELSE ROUND(positions.payment_amount / 100, 2)
                    END AS payment_amount,
                    ROUND(positions.amount / 100, 2) AS amount
                FROM purchases
                LEFT JOIN positions
                    ON purchases.id = positions.purchase_id
                LEFT JOIN stores
                    ON purchases.rsa_id = stores.rsa_id
                WHERE
                    purchases.id IN (" . join(",", $purchasesId) . ")
                ORDER BY
                    purchases.sale_time DESC   
            ");
            $query->execute();
            $queryResult = $query->fetchAll();
            if (count($queryResult)) {
                $lastId = null;
                $purchases = [];
                $positions = [];

                foreach ($queryResult as $row) {
                    if (!$lastId || $lastId != $row["id"]) {
                        array_push($purchases, [
                            "id"                => $row["id"],
                            "operation_date"    => $row["operation_date"],
                            "store_title"       => $row["store_title"],
                            "store_description" => $row["store_description"],
                            "amount"            => $row["purchase_amount"],
                            "cashback_amount"   => $row["purchase_cashback_amount"],
                            "discount_amount"   => $row["purchase_discount_amount"],
                            "payment_amount"    => $row["purchase_payment_amount"],
                            "positions"         => []
                        ]);

                        $lastId = $row["id"];
                    }

                    if ($row["product_title"] != null) {
                        array_push($positions, [
                            "purchase_id"       => $row["id"],
                            "product_title"     => $row["product_title"],
                            "cost"              => $row["cost"],
                            "cashback_amount"   => $row["cashback_amount"],
                            "discount_amount"   => $row["discount_amount"],
                            "payment_amount"    => $row["payment_amount"],
                            "amount"            => $row["amount"]
                        ]);
                    }
                }

                foreach ($purchases as $key => $purchase) {
                    foreach ($positions as $key => $position) if ($purchase["id"] == $position["purchase_id"]) array_push($purchase["positions"], $position);
                    array_push($result["data"], $purchase);
                }
                
                $result["status"] = true;
            }
        } else {
            $result["data"] = 'Чеки отсутствуют';
        }

        return $result;
    }

    private function importStores($stores) {
        $result = ["status" => false, "data" => []];

        try {
            $currentStores = [];

            $operationResult = $this->getStores();
            if ($operationResult["status"]) $currentStores = array_map(
                function($store) { return $store["rsa_id"]; },
                $operationResult["data"]
            );

            $this->pdo->beginTransaction();
            foreach ($stores as $store) array_push($result["data"], (!in_array($store["rsa_id"], $currentStores) ? $this->addStore($store) : $this->updateStore($store)));
            $this->pdo->commit();

            $result["status"] = true;
        } catch (\Throwable $th) {
            $result["data"] = $th->getMessage();
        }

        return $result;
    }

    private function addStore($store) {
        $result = ["status" => false];

        try {
            $query = $this->pdo->prepare("INSERT INTO stores (rsa_id, title) VALUES (?, ?)");
            $query->execute([$store["rsa_id"], $store["title"]]);

            $lastInsertId = $this->pdo->lastInsertId();

            $result = [
                "status" => true,
                "data" => $lastInsertId
            ];
        } catch (\Throwable $th) {
            $result["data"] = $th->getMessage();
        }

        return $result;
    }

    public function updateStore($store) {
        $result = ["status" => false];

        try {
            $inTransaction = $this->pdo->inTransaction();
            if (!$inTransaction) $this->pdo->beginTransaction();
            foreach ($store as $key => $value) {
                if (in_array($key, ["rsa_id", "title"])) {
                    $query = $this->pdo->prepare("UPDATE stores SET ".$key." = ? WHERE rsa_id = ?");
                    $query->execute([$value, $store["rsa_id"]]);

                    $result["status"] = true;
                }
            }
            if (!$inTransaction) $this->pdo->commit();
        } catch (Throwable $th) {
            $result["data"] = $th->getMessage();
        }

        return $result;
    }

    private function getStores() {
        $result = ["status" => false];

        $query = $this->pdo->prepare("SELECT
                s.id,
                c.title as 'city_name',
                s.city_id,
                s.rsa_id,
                s.title as 'store_name',
                s.description,
                s.coordinates
            FROM stores s
            LEFT JOIN cities c
                ON c.id = s.city_id
        ");
        $query->execute();
        $queryResult = $query->fetchAll();
        foreach ($this->array_unique_key($queryResult, 'city_name') as $item){
            if (!empty($item['city_name'])){
                $cities[] = [
                    'id' => $item['city_id'],
                    'name' => $item['city_name']
                ];
            }
        };

        if (count($queryResult)) {
            $result = [
                "status" => true,
                "data" => $queryResult,
                "cities" => $cities
            ];
        }

        return $result;
    }

    private function getStoresList($cityId) {
        $result = ["status" => false];


        $query = $this->pdo->prepare("SELECT
                s.id,
                s.rsa_id,
                s.title AS 'store_name',
                c.title AS 'city_name',
                s.description,
                IFNULL(s.shedule, '...') AS 'shedule', 
                s.coordinates,
                IFNULL(s.phone, '+7 ...') AS 'phone'
            FROM stores s
            LEFT JOIN cities c
                ON c.id = s.city_id
            WHERE city_id = ?
        ");

        $query->execute([$cityId]);
        $queryResult = $query->fetchAll();

        if (count($queryResult)) {
            $result = [
                "status" => true,
                "data" => $queryResult,
            ];
        }

        return $result;
    }

    private function getStoresFullData() {
        $result = ["status" => false];

        $query = $this->pdo->prepare("SELECT
                c.id,
                c.title,
                s.city_id,
                s.rsa_id,
                s.title AS store_title,
                s.description,
                s.shedule,
                s.phone,
                s.coordinates
            FROM
                cities c
            LEFT JOIN stores s ON
                c.id = s.city_id
            WHERE
                s.status = 1
            ORDER BY
                c.title
        ");
        $query->execute();
        $queryResult = $query->fetchAll();

        if (count($queryResult)) {
            $cities = [];
            foreach ($this->array_unique_key($queryResult, 'id') as $cityItem) {
                $cities[] = [
                    'id'    => $cityItem['id'],
                    'title' => $cityItem['title']
                ];
            }

            $stores = [];
            foreach ($queryResult as $storesItem) {
                $stores[] = [
                    'city_id'       => $storesItem['city_id'],
                    'rsa_id'        => $storesItem['rsa_id'],
                    'description'   => $storesItem['description'],
                    'shedule'       => $storesItem['shedule'],
                    'phone'         => $storesItem['phone'],
                    'coordinates'   => $storesItem['coordinates']
                ];
            }
            
            $result = [
                "status" => true,
                "data" => $queryResult
            ];
        }

        return $result;   
    }

    function array_unique_key($array, $key) {
        $tmp = $key_array = array();
        $i = 0;

        foreach ($array as $val) {
            if (!in_array($val[$key], $key_array)) {
                $key_array[$i] = $val[$key];
                $tmp[$i] = $val;
            }
            $i++;
        }
        return $tmp;
    }

    private function loginBoard($phone, $pass) {
        $result = $this->checkPassword($phone, $pass);
        $query = $this->pdo->prepare("SELECT status FROM accounts WHERE phone = ?");
        $query->execute([$phone]);
        $accountType = $query->fetch();
        if ($result["status"] && $accountType["status"] == 4) {
            $_SESSION['authBoard'] = 'login';
            $result = [
                "status" => true,
            ];
        }  else{
            $_SESSION['authBoard'] = 'not-login';
            $result = [
                "status" => false,
            ];
        }

        return $result;
    }

    public function updateProduct($product) {
        $result = ["status" => false];

        try {
            $inTransaction = $this->pdo->inTransaction();
            if (!$inTransaction) $this->pdo->beginTransaction();
            foreach ($product as $key => $value) {
                if (in_array($key, ["ext_id", "title"])) {
                    $query = $this->pdo->prepare("UPDATE products SET ".$key." = ? WHERE ext_id = ?");
                    $query->execute([$value, $product["ext_id"]]);

                    $result["status"] = true;
                }
            }
            if (!$inTransaction) $this->pdo->commit();
        } catch (Throwable $th) {
            $result["data"] = $th->getMessage();
        }

        return $result;
    }

    public function updateBarcode($barcode) {
        $result = ["status" => false];

        try {
            $inTransaction = $this->pdo->inTransaction();
            if (!$inTransaction) $this->pdo->beginTransaction();
            foreach ($barcode as $key => $value) {
                if (in_array($key, ["product_id"])) {
                    $query = $this->pdo->prepare("UPDATE barcodes SET " . $key . " = ? WHERE barcode = ?");
                    $query->execute([$value, $barcode["barcode"]]);

                    $result["status"] = true;
                }
            }
            if (!$inTransaction) $this->pdo->commit();
        } catch (Throwable $th) {
            $result["data"] = $th->getMessage();
        }

        return $result;
    }

    private function journal($source, $event, $comment = "", $status = null, $input = null, $output = null) {
        $result = ["status" => false];

        try {
            $cd = new DateTime();

            $query = $this->pdo->prepare("INSERT INTO journal (source, event, comment, status, input, output, time) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $query->execute([$source, $event, $comment, $status ? 1 : 0, $input, $output, $cd->format('Y-m-d H:i:s')]);

            $result = [
                "status" => true,
                "data" => $this->pdo->lastInsertId()
            ];
        } catch (\Throwable $th) {
            $result["data"] = $th->getMessage();
        }

        return $result;
    }

    private function getBonuscardsWithBirthdates() {
        $result = ["status" => false, "data" => null];

        $query = $this->pdo->prepare("SELECT
            bd.account_id,
            bd.card_number,
            bd.gift,
            bd.phone,
            bd.expiration + 14 AS expiration,
            e.ext_id
            FROM
                (SELECT 
                    T1.account_id,
                    T1.card_number,
                    T2.value AS gift,
                    T4.phone,
                    CASE
                    WHEN DATE_FORMAT(T5.birthdate, '%d/%m') = DATE_FORMAT(DATE_ADD(NOW(), INTERVAL -7 DAY), '%d/%m') THEN 1
                    WHEN DATE_FORMAT(T5.birthdate, '%d/%m') = DATE_FORMAT(DATE_ADD(NOW(), INTERVAL -6 DAY), '%d/%m') THEN 1
                    WHEN DATE_FORMAT(T5.birthdate, '%d/%m') = DATE_FORMAT(DATE_ADD(NOW(), INTERVAL -5 DAY), '%d/%m') THEN 2
                    WHEN DATE_FORMAT(T5.birthdate, '%d/%m') = DATE_FORMAT(DATE_ADD(NOW(), INTERVAL -4 DAY), '%d/%m') THEN 3
                    WHEN DATE_FORMAT(T5.birthdate, '%d/%m') = DATE_FORMAT(DATE_ADD(NOW(), INTERVAL -3 DAY), '%d/%m') THEN 4
                    WHEN DATE_FORMAT(T5.birthdate, '%d/%m') = DATE_FORMAT(DATE_ADD(NOW(), INTERVAL -2 DAY), '%d/%m') THEN 5
                    WHEN DATE_FORMAT(T5.birthdate, '%d/%m') = DATE_FORMAT(DATE_ADD(NOW(), INTERVAL -1 DAY), '%d/%m') THEN 6
                    WHEN DATE_FORMAT(T5.birthdate, '%d/%m') = DATE_FORMAT(NOW(), '%d/%m') THEN 7
                    WHEN DATE_FORMAT(T5.birthdate, '%d/%m') = DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 1 DAY), '%d/%m') THEN 8
                    WHEN DATE_FORMAT(T5.birthdate, '%d/%m') = DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 2 DAY), '%d/%m') THEN 9
                    WHEN DATE_FORMAT(T5.birthdate, '%d/%m') = DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 3 DAY), '%d/%m') THEN 10
                    WHEN DATE_FORMAT(T5.birthdate, '%d/%m') = DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 4 DAY), '%d/%m') THEN 11
                    WHEN DATE_FORMAT(T5.birthdate, '%d/%m') = DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 5 DAY), '%d/%m') THEN 12
                    WHEN DATE_FORMAT(T5.birthdate, '%d/%m') = DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 6 DAY), '%d/%m') THEN 13
                    WHEN DATE_FORMAT(T5.birthdate, '%d/%m') = DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 7 DAY), '%d/%m') THEN 14
                    END AS expiration
                    FROM
                    (bonuscards AS T1,
                    settings AS T2)
                    LEFT JOIN accounts AS T4
                    ON T1.account_id = T4.id
                    LEFT JOIN profiles AS T5
                    ON T1.account_id = T5.account_id
                    WHERE
                    T1.account_id IN (
                        SELECT 
                        account_id
                        FROM
                        profiles
                        WHERE
                        DATE_FORMAT(birthdate, '%d/%m') IN (
                            SELECT DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 1 DAY), '%d/%m')
                            UNION SELECT DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 2 DAY), '%d/%m')
                            UNION SELECT DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 3 DAY), '%d/%m')
                            UNION SELECT DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 4 DAY), '%d/%m')
                            UNION SELECT DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 5 DAY), '%d/%m')
                            UNION SELECT DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 6 DAY), '%d/%m')
                            UNION SELECT DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 7 DAY), '%d/%m')
                            UNION SELECT DATE_FORMAT(NOW(), '%d/%m')
                            UNION SELECT DATE_FORMAT(DATE_ADD(NOW(), INTERVAL -7 DAY), '%d/%m')
                            UNION SELECT DATE_FORMAT(DATE_ADD(NOW(), INTERVAL -6 DAY), '%d/%m')
                            UNION SELECT DATE_FORMAT(DATE_ADD(NOW(), INTERVAL -5 DAY), '%d/%m')
                            UNION SELECT DATE_FORMAT(DATE_ADD(NOW(), INTERVAL -4 DAY), '%d/%m')
                            UNION SELECT DATE_FORMAT(DATE_ADD(NOW(), INTERVAL -3 DAY), '%d/%m')
                            UNION SELECT DATE_FORMAT(DATE_ADD(NOW(), INTERVAL -2 DAY), '%d/%m')
                            UNION SELECT DATE_FORMAT(DATE_ADD(NOW(), INTERVAL -1 DAY), '%d/%m')
                        )
                        AND (last_cong IS NULL OR (YEAR(last_cong) != YEAR(NOW())))
                    )
                    AND T1.status = 1
                    AND T2.setting = 'gift'
                    LIMIT 50
                ) bd
                LEFT JOIN expirations e
                    ON bd.expiration = e.days
        ");
        $query->execute();

        $queryResult = $query->fetchAll();
        if (count($queryResult)) $result = [
            "status" => true,
            "data" => $queryResult
        ];

        return $result;
    }

    private function getOutdatedCards($limit = 50) {
        $result = ["status" => false, "data" => null];

        $query = $this->pdo->prepare("SELECT
                card_number,
                last_sync
            FROM
                bonuscards
            WHERE
                status = 1
                AND NOT account_id IS NULL
                AND last_sync < DATE_ADD(NOW(), INTERVAL -3 hour)
            LIMIT ?");
        $query->execute([$limit]);

        $queryResult = $query->fetchAll();
        if (count($queryResult)) $result = [
            "status" => true,
            "data" => $queryResult
        ];

        return $result;
    }

    private function getCardsToUpdateByPurchases() {
        $result = ["status" => false, "data" => null];

        $query = $this->pdo->prepare("SELECT
                dc.card_number,
                bc.last_sync
            FROM (SELECT
                    discount_card as card_number,
                    MAX(sale_time) AS sale_time
                FROM purchases
                WHERE sale_time > DATE_FORMAT(NOW(), '%y-%m-%d')
                GROUP BY discount_card) AS dc
            INNER JOIN bonuscards AS bc
                ON dc.card_number = bc.card_number AND dc.sale_time > bc.last_sync
            LIMIT 50");
        $query->execute();

        $queryResult = $query->fetchAll();
        if (count($queryResult)) $result = [
            "status" => true,
            "data" => $queryResult
        ];

        return $result;
    }

    private function getAccountsWithoutExtProfile($limit = 100) {
        $result = ["status" => false, "data" => null];

        $query = $this->pdo->prepare("SELECT a.phone, a.discount FROM accounts a LEFT JOIN profiles p ON a.id = p.account_id WHERE a.status != 0 AND p.ext_id IS NULL LIMIT ?");
        $query->execute([$limit]);
        $queryResult = $query->fetchAll();
        if (count($queryResult)) $result = [
            "status" => true,
            "data" => $queryResult
        ];

        return $result;
    }

    private function getAccountsWithoutExtCard($limit = 100) {
        $result = ["status" => false, "data" => null];

        $query = $this->pdo->prepare("SELECT
                a.phone,
                p.ext_id
            FROM accounts a
            LEFT JOIN profiles p ON a.id = p.account_id
            LEFT JOIN bonuscards b ON a.id = b.account_id
            WHERE
                a.status = 1
                AND NOT p.ext_id IS NULL
                AND b.id IS NULL
            LIMIT ?
        ");
        $query->execute([$limit]);
        $queryResult = $query->fetchAll();
        if (count($queryResult)) $result = [
            "status" => true,
            "data" => $queryResult
        ];

        return $result;
    }

    private function canParticipateInDrawing($cardNumber, $amount, $accountID) {
        $result = ["status" => false, "data" => null];
        $query = $this->pdo->prepare("SELECT status FROM accounts WHERE id = ?");
        $query->execute([$accountID]);
        $account = $query->fetch();

        $query = $this->pdo->prepare("SELECT
                    d.id,
                    p.discount_card,
                    CASE WHEN NOT d.confirmation_date IS NULL THEN 1 ELSE 0 END confirmation,
                    d.confirmation_date,
                    d.winner
                FROM
                    purchases p
                    LEFT JOIN bonuscards b
                        ON p.discount_card = b.card_number
                    LEFT JOIN drawing d
                        ON b.account_id = d.account_id AND d.confirmation_date >= DATE_ADD(DATE_FORMAT(DATE_ADD(NOW(),INTERVAL -(DAYOFWEEK(NOW())-1) DAY), '%Y-%m-%d'), INTERVAL 11 HOUR)
                WHERE
                    p.discount_card = :card_number
                    AND p.sale_time >= DATE_ADD(DATE_FORMAT(DATE_ADD(NOW(),INTERVAL -(DAYOFWEEK(NOW())-1) DAY), '%Y-%m-%d'), INTERVAL 11 HOUR)
                    AND p.amount >= :amount
            ");
        $query->execute(["card_number" => $cardNumber, "amount" => $amount]);

        try {
            $queryResult = $query->fetchAll();
            if($account["status"] == 3) {
                $result = [
                    "status" => true,
                    "data" => [
                        "code" => 4,
                        "description" => "Вы не можете быть зарегистрированы.",
                    ]
                ];
            }
            else{
                if (count($queryResult)) {
                    if ($queryResult[0]["confirmation"]) {
                        $result = [
                            "status" => true,
                            "data" => [
                                "code" => 1,
                                "id" => $queryResult[0]["id"],
                                "description" => "Вы уже зарегистрированы на участие в розыгрыше на текущей неделе.",
                                "confirmation_date" => $queryResult[0]["confirmation_date"]
                            ]
                        ];
                    } else {
                        $result = [
                            "status" => true,
                            "data" => [
                                "code" => 2,
                                "description" => "Вы можете принять участие в розыгрыше на этой неделе."
                            ]
                        ];
                    }
                } else {
                    $result = [
                        "status" => true,
                        "data" => [
                            "code" => 3,
                            "description" => "Совершите покупку на сумму от " . ($amount / 100) . " рублей и станьте одним из 10 обладателей приза еженедельно.",
                        ]
                    ];
                }
            }
        } catch (\Throwable $th) {
            $result["data"] = $th->getMessage();
        }

        return $result;
    }

    private function addParticipateInDrawing($account_id, $participateData) {
        $result = ["status" => false, "data" => null];

        if (!empty($participateData["firstname"]) && !empty($participateData["middlename"]) && !empty($participateData["lastname"]) && !empty($participateData["birthdate"])) {
            try {
                $cd = new DateTime();

                $query = $this->pdo->prepare("INSERT INTO drawing (account_id, confirmation_date, winner, firstname, middlename, lastname, birthdate)
                        VALUES (:account_id, :confirmation_date, 0, :firstname, :middlename, :lastname, :birthdate)");
                $query->execute([
                    "account_id" => $account_id,
                    "confirmation_date" => $cd->format('Y-m-d H:i:s'),
                    "firstname" => $participateData["firstname"],
                    "middlename" => $participateData["middlename"],
                    "lastname" => $participateData["lastname"],
                    "birthdate" => $participateData["birthdate"]
                ]);

                $result = [
                    "status" => true,
                    "data" => [
                        "confirmation_date" => $cd->format('Y-m-d H:i:s'),
                        "id" => $this->pdo->lastInsertId()
                    ]
                ];
            } catch (\Throwable $th) {
                $result["data"] = $th->getMessage();
            }
        } else {
            $result["data"]["description"] = "Не заполнены обязательные поля.";
        }

        return $result;
    }

    private function getPhonesWhoCanParticipateInDrawing($amount) {
        $result = ["status" => false, "data" => null];

        try {
            $query = $this->pdo->prepare("SELECT DISTINCT
                        a.phone,
                        t.alias
                    FROM 
                        purchases p
                        INNER JOIN bonuscards b
                            ON p.discount_card = b.card_number
                        INNER JOIN accounts a
                            ON b.account_id = a.id
                        INNER JOIN tokens t
                            ON a.id = t.account_id
                    WHERE
                        p.sale_time >= DATE_ADD(DATE_FORMAT(DATE_ADD(NOW(),INTERVAL -(DAYOFWEEK(NOW())-1) DAY), '%Y-%m-%d'), INTERVAL 11 HOUR)
                        AND p.amount >= :amount
                        AND NOT p.discount_card IN (SELECT b.card_number FROM drawing d INNER JOIN bonuscards b ON d.account_id = b.account_id WHERE d.confirmation_date >= DATE_ADD(DATE_FORMAT(DATE_ADD(NOW(),INTERVAL -(DAYOFWEEK(NOW())-1) DAY), '%Y-%m-%d'), INTERVAL 11 HOUR))
                ");
            $query->execute(["amount" => $amount]);
            $queryResult = $query->fetchAll();
            if (count($queryResult)) {
                $result = [
                    "status" => true,
                    "data" => $queryResult
                ];
            }
        } catch (\Throwable $th) {
            $result["data"] = $th->getMessage();
        }

        return $result;
    }

    private function getPurchasesToProcessing() {
        $result = ["status" => false, "data" => null];

        $query = $this->pdo->prepare("SELECT
                    p.discount_card AS card_number,
                    p.rsa_id AS shopNum,
                    p.cash AS cashNum,
                    p.shift AS shiftNum,
                    p.number AS checkNum,
                    pp.purchase_id AS purchase_id,
                    SUM(CASE
                        WHEN c.type = 'fix' THEN ROUND((pp.count / 1000) * c.value)
                        WHEN c.type = 'percent' THEN FLOOR((pp.count / 1000) * (pp.cost / 100) * (c.value / 100)) * 100
                    END) AS cashback_value
                FROM
                    purchases p
                    INNER JOIN positions pp
                        ON p.id = pp.purchase_id
                    INNER JOIN cashback c
                        ON pp.product_id = c.product_id
                WHERE
                    p.sale_time > DATE_FORMAT(NOW(), '%Y-%m-%d')
                    AND p.processing_completed = 0
                    AND p.operation_type = 1
                GROUP BY
                    p.discount_card,
                    p.rsa_id,
                    p.cash,
                    p.shift,
                    p.number,
                    pp.purchase_id
            ");
        $query->execute();
        $queryResult = $query->fetchAll();
        if (count($queryResult)) $result = [
            "status" => true,
            "data" => $queryResult
        ];

        return $result;
    }

    private function addReferral($refAccountId, $accountId) {
        $result = ["status" => false];

        try {
            $query = $this->pdo->prepare("INSERT INTO referrals (ref_account_id, account_id) VALUES (?, ?)");
            $query->execute([$refAccountId, $accountId]);

            $lastInsertId = $this->pdo->lastInsertId();

            $result = [
                "status" => true,
                "data" => $lastInsertId
            ];
        } catch (\Throwable $th) {
            $result["data"] = $th->getMessage();
        }

        return $result;
    }

    private function updateReferral($account_id, $data) {
        $result = ["status" => false];

        try {
            $inTransaction = $this->pdo->inTransaction();
            if (!$inTransaction) $this->pdo->beginTransaction();
            foreach ($data as $key => $value) {
                if (in_array($key, ["gifted"])) {
                    $query = $this->pdo->prepare("UPDATE referrals SET ".$key." = ? WHERE account_id = ?");
                    $query->execute([$value, $account_id]);

                    $result["status"] = true;
                }
            }
            if (!$inTransaction) $this->pdo->commit();
        } catch (Throwable $th) {
            $result["data"] = $th->getMessage();
        }

        return $result;
    }

    private function getBonuscardsToReferralCong() {
        $query = $this->pdo->prepare("SELECT DISTINCT
                T1.account_id,
                T4.card_number,
                T1.gifted
            FROM
                (referrals AS T1
                INNER JOIN accounts AS T2
                    ON T1.account_id = T2.id AND T2.status = 1
                INNER JOIN bonuscards AS T3
                    ON T1.account_id = T3.account_id
                INNER JOIN bonuscards AS T4
                    ON T1.ref_account_id = T4.account_id
                INNER JOIN profiles AS T6
                    ON T1.account_id = T6.account_id)
            WHERE T6.last_sync > DATE_ADD(NOW(), INTERVAL -90 DAY) AND T1.gifted = 0
            LIMIT 50
        ");
        $query->execute();
        $queryResult = $query->fetchAll();
        $settingRefGiftQuery = $this->pdo->prepare("SELECT value FROM settings WHERE setting= ?");
        $settingRefGiftQuery->execute(['referral_gift']);
        $referralGift = $settingRefGiftQuery->fetch()['value'];
        $rows = [];
        if (count($queryResult)) {
            foreach ($queryResult as $item){
                if($item['gifted'] == 0){
                    $item['referral_gift'] = $referralGift;
                    $rows[] = $item;
                }
            }
        }

        return [
            'status' => !empty($rows),
            'data' => $rows,
        ];
    }

    private function getNews($lastNewsId = 0, $limit = 50) {
        $result = ["status" => true, "data" => []];

        $cd = new DateTime();
        $query = $this->pdo->prepare("SELECT
                id,
                date_to_post,
                date,
                image,
                title,
                description
            FROM
                news
            WHERE
                id > :lastNewsId
                AND date_to_post <= :cd
            ORDER BY
                id
            LIMIT :limit
        ");
        $query->execute(["lastNewsId" => $lastNewsId, "cd" => $cd->format('Y-m-d'), "limit" => $limit]);
        $queryResult = $query->fetchAll();
        if (count($queryResult)) $result = [
            "status" => true,
            "data" => $queryResult
        ];

        return $result;
    }

    private function getDrawingWinners(){
        $durations = [
            1 => [
                'firstDay' => '2021-06-27',
                'lastDay' => '2021-07-03',
            ],
            2 => [
                'firstDay' => '2021-07-04',
                'lastDay' => '2021-07-10',
            ],
            3 => [
                'firstDay' => '2021-07-11',
                'lastDay' => '2021-07-17',
            ],
            4 => [
                'firstDay' => '2021-07-18',
                'lastDay' => '2021-07-24',
            ],
            5 => [
                'firstDay' => '2021-07-25',
                'lastDay' => '2021-07-31',
            ],
            6 => [
                'firstDay' => '2021-08-01',
                'lastDay' => '2021-08-07',
            ],
            7 => [
                'firstDay' => '2021-08-08',
                'lastDay' => '2021-08-14',
            ],
            8 => [
                'firstDay' => '2021-08-15',
                'lastDay' => '2021-08-21',
            ],
        ];

        foreach ($durations as $duration){
            $query = $this->pdo->prepare("SELECT
                id,
                SUBSTR(lastname,1,1) AS lastname,
                firstname AS firstname,
                SUBSTR(middlename,1,1) AS middlename,
                confirmation_date
            FROM
                drawing d
            WHERE winner = 1 AND confirmation_date BETWEEN '". $duration['firstDay'] ."' AND '". $duration['lastDay'] ."'
            ");
            $query->execute();
            $queryResult = $query->fetchAll();

            $result[] = [
                'data' => $queryResult,
                'duration' => "".$duration['firstDay']." - ".$duration['lastDay']."",
            ];
        }


        return $result;
    }

    private function showPopupDrawing(){
        if(!isset($_SESSION['showPopupDrawing'])){
            $_SESSION['showPopupDrawing'] = true;
            $result = [
                "status" => true,
            ];
        }
        else{
            $result = [
                "status" => false,
            ];
        }

        return $result;
    }

    private function setFeedback($phone = null, $data) {
        $result = ["status" => true, "data" => $data, "phone" => $phone];

        try {
            $cd = new DateTime();
            
            $query = $this->pdo->prepare("INSERT INTO feedbacks 
                (
                    name,
                    account_phone,
                    phone,
                    email,
                    message,
                    time,
                    reason
                ) VALUES (
                    :name,
                    :account_phone,
                    :phone,
                    :email,
                    :message,
                    :time,
                    :reason
                )
            ");
            $query->execute([
                $data["name"],
                $phone,
                $data["phone"],
                $data["email"],
                $data["message"],
                $cd->format('Y-m-d H:i:s'),
                $data["reason"]
            ]);

            $result = [
                "status" => true,
                "data" => $this->pdo->lastInsertId()
            ];
        } catch (\Throwable $th) {
            $result["data"] = $th->getMessage();
        }

        return $result;
    }

    /* Работа с внешними ИБ */

    private function updateCardDataByLMX($personId, $cardNumber, $fromDate) {
        $result = ["status" => false, "data" => []];
        if (empty($personId)) return $result;

        $cd = new DateTime();

        $LMX = $this->getLMX();
        $getBalanceResult = $LMX->getBalance($personId);
        if ($getBalanceResult["status"]) {
            $this->pdo->beginTransaction();

            $newDate = new DateTime($fromDate);
            $newDate->add(new DateInterval('P1D'));
            $filters = [
                "startChequeTime" => $fromDate,
                "count" => 9999,
                "personId" => $personId,
                "state" => "Confirmed"
            ];
            $getPurchasesFullDataResult = $LMX->getPurchasesFullData($filters);
            if ($getPurchasesFullDataResult["status"]) {
                $currentPurchases = [];
                $getPurchasesHashResult = $this->getPurchasesHash($personId);
                if ($getPurchasesHashResult["status"]) $currentPurchases = $getPurchasesHashResult["data"];

                foreach ($getPurchasesFullDataResult["data"]["purchases"] as $purchase) array_push($result["data"], in_array(md5($purchase["rsa_id"] . $purchase["sale_time"] . $purchase["number"]), $currentPurchases) ? ["status" => false] : $this->addPurchase($purchase, $purchase["rsa_id"], $personId));
            }
            
            // Запись даты синхронизации баланса
            $setBonusCardDataResult = $this->setBonusCardData($cardNumber, ["last_sync" => $cd->format('Y-m-d H:i:s'), "balance" => $getBalanceResult["data"]["amount"] * 100]);
            if ($setBonusCardDataResult["status"]) {
                $this->pdo->commit();

                $result = $setBonusCardDataResult;
            } else {
                $this->pdo->rollback();
            }
        } else {
            $this->journal("APP", __FUNCTION__, "", $getBalanceResult["status"], json_encode(["f" => "LMX->getBalance", "a" => [$personId], "outer" => [$personId, $cardNumber, $fromDate]]), json_encode($getBalanceResult, JSON_UNESCAPED_UNICODE));
        }

        return $result;
    }

    /* Работа с провайдерами сообщений */

    private function sms($phone, $message, $callback = false) {
        $result = ["status" => false];

        try {
            $sms_text = $message;
            $target = '+'.$phone;
            $sender = (API_DEBUG ? "" : "STOLICA-DV");
            $period = 600;
            $sms = new QTSMS(SMS_API_USER, SMS_API_PASS, "a2p-sms-https.beeline.ru");
            $requestResult = $sms->post_message($sms_text, $target, $sender, null, $period);
            $requestResultData = new SimpleXMLElement($requestResult);
            if ($requestResultData->result->sms["id"]) {
                $result["status"] = true;
                $result["data"] = ["ext_id" => $requestResultData->result->sms["id"]->__toString()];
                if ($callback) {
                    $status = "";
                    $statuses = ["delivered", "rejected", "undeliverable", "error", "expired", "unknown", "aborted"];
                    $counter = 15;

                    while (!in_array($status, $statuses) && $counter) {
                        sleep(1);

                        $requestResult = $sms->status_sms_id($result["data"]["ext_id"]);
                        $requestResultData = new SimpleXMLElement($requestResult);
                        if (isset($requestResultData->MESSAGES->MESSAGE->SMSSTC_CODE)) $status = $requestResultData->MESSAGES->MESSAGE->SMSSTC_CODE->__toString();

                        $counter--;
                    }

                    $result["data"]["status"] = $status;
                }
            } else {
                $result["data"] = $requestResultData->result;
            }
        } catch (\Throwable $th) {
            $result["data"] = $th->getMessage();
        }

        return $result;
    }

    private function smsMulti($phones, $message) {
        $result = ["status" => false];

        try {
            $sms_text = $message;
            $targets = '+'.join(", +", $phones);
            $sender = (API_DEBUG ? "" : "STOLICA-DV");
            $period = 600;
            $sms = new QTSMS(SMS_API_USER, SMS_API_PASS, "a2p-sms-https.beeline.ru");
            $requestResult = $sms->post_message($sms_text, $targets, $sender, null, $period);
            $requestResultData = new SimpleXMLElement($requestResult);
            if ($requestResultData->result->sms["id"]) {
                $result["status"] = true;
                $result["data"] = ["ext_id" => $requestResultData->result->sms["id"]->__toString()];
            } else {
                $result["data"] = $requestResultData->result;
            }
        } catch (\Throwable $th) {
            $result["data"] = $th->getMessage();
        }

        return $result;
    }

    private function callPassword($phone, $message) {
        $result = ["status" => false];

        $methodName = 'call-password/start-password-call';

        $data = json_encode([
            'async' => 1,
            'dstNumber' => $phone,
            'pin' => $message,
            'timeout' => 30,
        ]);
        $time = time();

        $requestKey = NT_API_ACCESS_KEY . $time . hash('sha256',
            $methodName . "\n" .
            $time . "\n" .
            NT_API_ACCESS_KEY . "\n" .
            $data . "\n" .
            NT_API_SIGNATURE_KEY
        );

        $resId = curl_init();
        curl_setopt_array($resId, [
            CURLINFO_HEADER_OUT => true,
            CURLOPT_HEADER => 0,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $requestKey,
                'Content-Type: application/json',
            ],
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_URL =>'https://api.new-tel.net/call-password/start-password-call',
            CURLOPT_POSTFIELDS => $data,
        ]);
        $response = curl_exec($resId);
        $curlInfo = curl_getinfo($resId);

        $responseData = json_decode($response);

        $result["status"] = $responseData->data->result == "success";
        if ($result["status"]) $result["data"] = ["ext_id" => $responseData->data->callDetails->callId];

        return $result;
    }

    private function sendMessageDig($phone, $message, $type = "SMS") {
        $result = ["status" => false];

        if (empty($phone)) return ["status" => false, "data" => "Empty phone"];
        if (empty($message)) return ["status" => false, "data" => "Empty message"];

        $authToken = DIG_API_TOKEN;

        $context = stream_context_create(array(
            'http' => array(
                'method' => 'POST',
                'header' => [
                    "Authorization: Bearer $authToken",
                    "Content-Type: application/json"
                ],
                'content' => '[{"channelType":"'.$type.'","senderName":"sms info","destination":"'.$phone.'","content":"'.$message.'"}]'
            )
        ));

        try {
            $response = file_get_contents("https://direct.i-dgtl.ru/api/v1/message", FALSE, $context);

            $responseData = json_decode($response, TRUE);
            $result["status"] = !$responseData["errors"];
            if ($result["status"]) $result["data"] = ["ext_id" => $responseData["items"][0]["messageUuid"]];
        } catch (\Throwable $th) {
            $result["data"] = $th->getMessage();
        }

        return $result;
    }

    private function tg($message, $status = "info") {
        $emoji = [
            "info" => "💬",
            "sos" => "🆘",
            "warning" => "⚠️"
        ];

        return file_get_contents("https://api.telegram.org/bot906763368:AAE1rqS8ooFwOHW00fX7PsOlRIi8c990zAY/sendMessage?chat_id=-550701196&text=" . $emoji[$status] . "\n" . $message);
    }
}
?>