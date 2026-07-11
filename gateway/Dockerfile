FROM kong:3.6
COPY kong.yml /etc/kong/kong.yml
ENV KONG_DATABASE=off
ENV KONG_DECLARATIVE_CONFIG=/etc/kong/kong.yml
EXPOSE 8000