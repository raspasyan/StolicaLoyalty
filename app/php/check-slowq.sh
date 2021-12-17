#!/bin/bash
 

inotifywait -qm --event modify /var/log/mysqld/slow-queries.log \
        | while read FILENAME
                do
                    php73 /var/www/bonus.stolica-dv.ru/public_html/app/php/deamon.php
                done