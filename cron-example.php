<?php
ini_set("display_errors", 1);
ini_set('soap.wsdl_cache_enabled',0);
ini_set('soap.wsdl_cache_ttl',0);
date_default_timezone_set("Asia/Vladivostok");
session_start();

print_r(file_get_contents('https://bonus.stolica-dv.ru/cron?token=gruesome&method=cron3'));
?>