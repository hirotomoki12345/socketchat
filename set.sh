#!/bin/bash

LANGUAGE=$(locale | grep LANG= | cut -d= -f2 | cut -d_ -f1)

if [ "$LANGUAGE" = "ja" ]; then
    INSTALL_PROMPT="pm2 がインストールされていません。インストールしますか？ (y/n)"
    INSTALL_SUCCESS="pm2 をインストールしました。"
    INSTALL_FAIL="pm2 がインストールされていないため、スクリプトを終了します。"
    MENU_TITLE="何をしますか？"
    OPTION1="アプリケーションを起動"
    OPTION2="アプリケーションを停止"
    OPTION3="アプリケーションとディレクトリを削除"
    OPTION4="終了"
    STOP_SUCCESS="アプリケーションを停止しました。"
    DELETE_SUCCESS="アプリケーションとディレクトリを削除しました。"
    INVALID_OPTION="無効な選択肢です。"
else
    INSTALL_PROMPT="pm2 is not installed. Would you like to install it? (y/n)"
    INSTALL_SUCCESS="pm2 has been installed."
    INSTALL_FAIL="pm2 is not installed. Exiting script."
    MENU_TITLE="What would you like to do?"
    OPTION1="Start application"
    OPTION2="Stop application"
    OPTION3="Remove application and directory"
    OPTION4="Exit"
    STOP_SUCCESS="Application stopped."
    DELETE_SUCCESS="Application and directory removed."
    INVALID_OPTION="Invalid option."
fi

if ! command -v pm2 &> /dev/null; then
    echo "$INSTALL_PROMPT"
    read -r install_pm2

    if [ "$install_pm2" = "y" ]; then
        npm install -g pm2
        echo "$INSTALL_SUCCESS"
    else
        echo "$INSTALL_FAIL"
        exit 1
    fi
fi

echo "$MENU_TITLE"
echo "1) $OPTION1"
echo "2) $OPTION2"
echo "3) $OPTION3"
echo "4) $OPTION4"

read -r option

case $option in
    1)
        git clone https://github.com/hirotomoki12345/socketchat.git
        cd socketchat || exit
        npm install

        pm2 start server.js --name socketchat

        pm2 startup
        pm2 save

        echo "Application is running in the background."
        ;;
    2)
        pm2 stop socketchat
        echo "$STOP_SUCCESS"
        ;;
    3)
        pm2 stop socketchat
        pm2 delete socketchat
        cd ..
        rm -rf socketchat
        echo "$DELETE_SUCCESS"
        ;;
    4)
        echo "Exiting."
        exit 0
        ;;
    *)
        echo "$INVALID_OPTION"
        ;;
esac
