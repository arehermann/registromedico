# Servidor de FamLog para la Raspberry

Recibe el documento desde la app, se lo pasa a Claude y devuelve los datos leídos.
La clave de la API queda solo acá, nunca en el celular.

## 1. Clave de la API de Claude

1. Entrá a https://console.anthropic.com con tu cuenta (la del medio de pago).
2. **Settings → Limits**: poné un tope de gasto mensual, por ejemplo 5 USD.
3. **API Keys → Create Key**, nombre `famlog`. Copiá la clave (empieza con `sk-ant-`); se ve una sola vez.

## 2. Instalar en la Raspberry

Necesita Node 20.6 o más nuevo (`node -v`).

```bash
git clone https://github.com/arehermann/registromedico.git
cp -r registromedico/server ~/famlog-ia
cd ~/famlog-ia
npm install --omit=dev
cp .env.ejemplo .env
nano .env        # pegá la clave de la API e inventá FAMLOG_CLAVE
npm start        # debería decir "FamLog IA escuchando en el puerto 8787"
```

Para que arranque solo con la Raspberry (si tu usuario no es `pi`, cambialo en el archivo):

```bash
sudo cp famlog-ia.service /etc/systemd/system/
sudo systemctl enable --now famlog-ia
journalctl -u famlog-ia -f     # para ver qué pasa
```

## 3. Darle una dirección https

La app está en GitHub Pages (https), así que el servidor también tiene que tener https.

- **Si ya publicás otras apps con un dominio** (Nginx, Caddy o Cloudflare Tunnel), agregá un
  subdominio, por ejemplo `famlog.tu-dominio.com`, que apunte a `http://localhost:8787`.
- **Con Tailscale** (gratis). Esto no publica ninguna app, solo le da al servidor una dirección
  https para que FamLog lo encuentre. Usá el puerto 8443 para no pisar otras apps que ya tengas
  en el 443 (revisalas antes con `tailscale funnel status`):
  ```bash
  sudo tailscale funnel --bg --https=8443 http://127.0.0.1:8787
  ```
  La dirección queda como `https://raspberrypi.tu-red.ts.net:8443`. Si los dos celulares ya tienen
  Tailscale, podés usar `serve` en lugar de `funnel` y el servidor queda visible solo dentro de tu red.

## 4. Conectar la app

En FamLog: **Ajustes → Lectura de documentos con IA**, pegá la dirección https y la
`FAMLOG_CLAVE`, y tocá **Guardar y probar**. El otro padre hace lo mismo en su celular.

## Costos y ajustes

- `FAMLOG_MODELO`: `claude-opus-5-5` (por defecto, el que mejor lee letra difícil, unos 5 centavos
  de dólar por documento), `claude-sonnet-5-5` (cerca de la mitad) o `claude-haiku-5-5`
  (bastante menos de un centavo).
- `FAMLOG_MAX_DIA`: tope de documentos por día (40 por defecto).
- `uso.json` lleva la cuenta diaria de documentos y tokens.
- Para actualizar: `git pull` en `registromedico` y volvé a copiar `servidor.js` y `extraccion.js`.
