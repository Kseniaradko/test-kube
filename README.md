# React to Kubernetes Demo

Небольшое учебное приложение, на котором можно показать полный путь доставки:

1. меняем React-компонент;
2. проверяем локально через Vite;
3. собираем production-образ;
4. публикуем его в registry;
5. деплоим в Kubernetes через Helm;
6. отдельно обновляем runtime-конфиг без пересборки фронтенда.

## Что внутри

- `src/App.tsx` и `src/components/StatusCard.tsx` - UI, который удобно менять на демо.
- `public/runtime-config.js` - шаблон runtime-конфига.
- `docker/entrypoint.sh` - подставляет env-переменные в `runtime-config.js` при старте контейнера.
- `Dockerfile` - multi-stage сборка фронтенда и упаковка в `nginx`.
- `helm/test-app` - Helm chart для k0s/Timeweb Cloud.

## Предварительные требования

Нужны:

- Node.js 22+;
- Docker;
- Helm 3;
- `kubectl`, настроенный на твой k0s-кластер в Timeweb Cloud;
- доступ к registry, куда можно пушить образы.

## 1. Локальный запуск

Установить зависимости:

```bash
npm install
```

Запустить dev-сервер:

```bash
npm run dev
```

После этого открой адрес, который покажет Vite.

## 2. Показать изменение компонента

Для демонстрации правь один из файлов:

- `src/components/StatusCard.tsx` - структура карточки;
- `src/App.tsx` - текст, шаги лабы, кнопка;
- `src/styles.css` - внешний вид.

Простой сценарий показа:

1. Открыть `src/components/StatusCard.tsx`.
2. Поменять заголовок, подпись или один из label.
3. Сохранить файл.
4. Показать, что Vite сразу отобразил изменение.

## 3. Production build

```bash
npm run build
```

Готовая production-сборка появится в `dist/`.

## 4. Сборка Docker-образа

Пример локальной сборки:

```bash
docker build -t test-app:local .
```

Пример локального запуска контейнера:

```bash
docker run --rm -p 8080:80 \
  -e APP_TITLE="Timeweb Lab Demo" \
  -e APP_ENV="demo" \
  -e APP_BANNER="Runtime config delivered by container env" \
  -e APP_VERSION="1.0.0" \
  -e APP_HIGHLIGHT_LABEL="Container smoke test" \
  test-app:local
```

Проверить:

- приложение: `http://localhost:8080`
- healthcheck: `http://localhost:8080/healthz`

## 5. Загрузка образа в registry

Пример для произвольного registry:

```bash
docker tag test-app:local registry.example.com/demo/test-app:1.0.0
docker push registry.example.com/demo/test-app:1.0.0
```

Если используешь GitHub Container Registry, пример будет таким:

```bash
docker tag test-app:local ghcr.io/<your-org-or-user>/test-app:1.0.0
docker push ghcr.io/<your-org-or-user>/test-app:1.0.0
```

## 6. Деплой в k0s / Timeweb Cloud через Helm

Базовый запуск:

```bash
helm upgrade --install demo ./helm/test-app \
  --set image.repository=ghcr.io/<your-org-or-user>/test-app \
  --set image.tag=1.0.0
```

Если registry приватный, сначала создай secret:

```bash
kubectl create secret docker-registry regcred \
  --docker-server=ghcr.io \
  --docker-username=<your-user> \
  --docker-password=<your-token> \
  --docker-email=<your-email>
```

И передай его в chart:

```bash
helm upgrade --install demo ./helm/test-app \
  --set image.repository=ghcr.io/<your-org-or-user>/test-app \
  --set image.tag=1.0.0 \
  --set imagePullSecrets[0].name=regcred
```

Проверка релиза:

```bash
kubectl get pods,svc
kubectl rollout status deployment/demo-test-app
```

Если `LoadBalancer` не выдает внешний IP, есть два быстрых варианта:

1. временно переключить сервис в `NodePort`;
2. сделать port-forward:

```bash
kubectl port-forward svc/demo-test-app 8080:80
```

## 7. Показать изменение конфигурации без пересборки

Это второй важный сценарий лабы: React-код не меняется, меняются только values/env.

Пример обновления runtime-конфига:

```bash
helm upgrade --install demo ./helm/test-app \
  --set image.repository=ghcr.io/<your-org-or-user>/test-app \
  --set image.tag=1.0.0 \
  --set appConfig.title="Timeweb Demo" \
  --set appConfig.environment="prod" \
  --set appConfig.banner="This text came from Helm values" \
  --set appConfig.version="1.0.0" \
  --set appConfig.highlightLabel="Config updated without rebuild"
```

После обновления страницы увидишь новый banner, environment и label без пересборки frontend bundle.

## 8. Полезный сценарий показа целиком

На демо можно пройти такой путь:

1. `npm run dev` и показать исходный экран.
2. Поменять текст в `src/components/StatusCard.tsx`.
3. Показать локальное обновление UI.
4. Выполнить `npm run build`.
5. Собрать и запушить Docker-образ с новым тегом.
6. Выполнить `helm upgrade --install` с новым `image.tag`.
7. Показать приложение уже из Kubernetes.
8. Потом изменить только `appConfig.banner` и снова сделать `helm upgrade --install`.
9. Показать, что конфиг изменился без изменения React-кода и без новой сборки фронтенда.

## 9. Полезные команды

Отрендерить chart без деплоя:

```bash
helm template demo ./helm/test-app
```

Удалить релиз:

```bash
helm uninstall demo
```

Посмотреть ресурсы:

```bash
kubectl get all
kubectl describe deployment demo-test-app
```
