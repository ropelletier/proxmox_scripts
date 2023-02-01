#!/bin/bash
sed -Ezi.bak "s/(Ext.Msg.show\(\{\s+title: gettext\('No valid sub)/void\(\{ \/\/\1/g" /usr/share/javascript/proxmox-widget-toolkit/proxmoxlib.js && systemctl restart pveproxy.service
wget https://github.com/Jamesits/pve-fake-subscription/releases/download/v0.0.9/pve-fake-subscription_0.0.9+git-1_all.deb
dpkg -i pve-fake-subscription_0.0.9+git-1_all.deb 
echo "127.0.0.1 shop.maurer-it.com" | sudo tee -a /etc/hosts
