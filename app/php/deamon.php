<?php

class checkBadQuery{
    public function initPDO() {
        require_once 'var/www/bonus.stolica-dv.ru/public_html/app/php/const.php';
        $result = ["status" => false];

        try {
            $this->pdo = new PDO("mysql:host=".DB_HOST.";dbname=".DB_NAME.";charset=utf8", DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);

            $result["status"] = true;
        } catch (\Throwable $th) {
            $result["description"] = "Сервис временно недоступен, выполяются профилактические работы.";
        }

        return $result;
    }

    public function messageToTelegram($log)
    {
        $ch = curl_init();
        curl_setopt_array(
            $ch,
            array(
                CURLOPT_URL => 'https://api.telegram.org/bot906763368:AAE1rqS8ooFwOHW00fX7PsOlRIi8c990zAY/sendMessage',
                CURLOPT_POST => TRUE,
                CURLOPT_RETURNTRANSFER => TRUE,
                CURLOPT_TIMEOUT => 10,
                CURLOPT_POSTFIELDS => array(
                    'chat_id' => '-550701196',
                    'text' => $log,
                ),
            )
        );
        curl_exec($ch);
    }

    public function checkQuery(){
        $stop = false;
        $pid = pcntl_fork();
        if ($pid == -1) {
            die('Error fork process' . PHP_EOL);
        } elseif ($pid) {
            die('Die parent process' . PHP_EOL);
        } else {

            $this->initPDO();

            while(!$stop) {

                $query = $this->pdo->query("SELECT value FROM settings WHERE setting='bad_query'")->fetchColumn();
                $lastBadQuery = filemtime('var/log/mysqld/slow-queries.log');
                if ($query != $lastBadQuery) {
                    $this->pdo->query("UPDATE settings SET value='".$lastBadQuery."' WHERE setting='bad_query'");

                    $fileLog = file_get_contents('var/log/mysqld/slow-queries.log');
                    $pos = strrpos($fileLog, 'Query_time');

                    $log = substr($fileLog, $pos);

                    $this->messageToTelegram($log);
                }
                else{
                    continue;
                }

                sleep(10);
            }
        }

        posix_setsid();
    }



}

$check = new checkBadQuery;

return $check->checkQuery();


?>