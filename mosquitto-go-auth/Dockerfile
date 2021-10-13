FROM iegomez/mosquitto-go-auth:1.6.0

COPY config/* /etc/mosquitto/

EXPOSE 1883 1884

ENTRYPOINT ["sh", "-c", "/usr/sbin/mosquitto -c /etc/mosquitto/mosquitto.conf" ]
