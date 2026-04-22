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

## 1. Подключение kubectl к кластеру

Сначала нужно получить `kubeconfig` для кластера из Timeweb Cloud. В этом сценарии используется файл `twc-prod-last-config.yaml`.

Если файл лежит в `Downloads`, подключение выглядит так:

```bash
export KUBECONFIG=~/Downloads/twc-prod-last-config.yaml
kubectl config get-contexts
kubectl config current-context
kubectl get nodes
kubectl cluster-info
```

Если `current-context` не выбран, сначала посмотри список доступных context:

```bash
kubectl config get-contexts
```

Потом выбери нужный context по имени из колонки `NAME`:

```bash
kubectl config use-context twc-prod
```

После этого можно проверить доступ к кластеру и namespace:

```bash
kubectl get nodes
kubectl get ns
kubectl get pods -n default
```

Если не хочешь делать `export`, можно указывать `kubeconfig` прямо в команде:

```bash
KUBECONFIG=~/Downloads/twc-prod-last-config.yaml kubectl get nodes
```

Для `k9s` используется тот же `kubeconfig`:

```bash
KUBECONFIG=~/Downloads/twc-prod-last-config.yaml k9s
```

## 2. Локальный запуск

Установить зависимости:

```bash
npm install
```

Запустить dev-сервер:

```bash
npm run dev
```

После этого открой адрес, который покажет Vite.

## 3. Показать изменение компонента

Для демонстрации правь один из файлов:

- `src/components/StatusCard.tsx` - структура карточки;
- `src/App.tsx` - текст, шаги лабы, кнопка;
- `src/styles.css` - внешний вид.

Простой сценарий показа:

1. Открыть `src/components/StatusCard.tsx`.
2. Поменять заголовок, подпись или один из label.
3. Сохранить файл.
4. Показать, что Vite сразу отобразил изменение.

## 4. Production build

```bash
npm run build
```

Готовая production-сборка появится в `dist/`.

## 5. Сборка Docker-образа

Пример локальной сборки:

```bash
docker build -t demo:local .
```

Если собираешь образ на Mac, а Kubernetes-ноды в кластере работают на Linux `amd64`, для деплоя лучше собирать образ сразу под нужную архитектуру. Иначе можно получить `exec format error` при старте контейнера.

Пример сборки и отправки образа в registry для Linux-нод:
Надо изначально создать себе регистри и залогиниться в него, а потом подставить название регистри в команду ниже

```bash
docker buildx build \
  --platform linux/amd64 \
  -t app.registry.twcstorage.ru/demo/test-app:1.0.0 \
  --push .
```

Если хочешь один тег и для локальной работы на Mac, и для кластера, можно собрать multi-arch образ:

Пример локального запуска контейнера:

```bash
docker run --rm -p 8080:80 \
  -e APP_TITLE="Timeweb Lab Demo" \
  -e APP_ENV="demo" \
  -e APP_BANNER="Runtime config delivered by container env" \
  -e APP_VERSION="1.0.0" \
  -e APP_HIGHLIGHT_LABEL="Container smoke test" \
  demo:local
```

Проверить:

- приложение: `http://localhost:8080`
- healthcheck: `http://localhost:8080/healthz`

## 6. Загрузка образа в registry (он уже был загружен выше, так тоже можно было закинуть)

Пример для произвольного registry:

```bash
docker tag demo:local app-test-spb.registry.twcstorage.ru/demo/demo-app:1.0.0
docker push app-test-spb.registry.twcstorage.ru/demo/demo-app:1.0.0
```

## 7. Деплой в k0s / Timeweb Cloud через Helm
Надо изначально добавить реестр в кубернетис в определенный неймспейс, тут дальше команда для дефолтного неймспейса
надо подставить название реестра и название секретов и тэга

Базовый запуск:

```bash
helm upgrade --install demo ./helm/test-app \
  -n default \
  --set image.repository=app.registry.twcstorage.ru/demo/test-app \
  --set image.tag=1.0.0 \
  --set 'imagePullSecrets[0].name=craas-app'
```

Как эта команда добавляет deployment в Kubernetes:

1. `helm upgrade --install` берет chart из `./helm/test-app`.
2. Helm читает `values.yaml` и подмешивает значения из `--set`.
3. Потом Helm рендерит шаблоны из `helm/test-app/templates/`.
4. Из `templates/deployment.yaml` получается реальный Kubernetes `Deployment`.
5. Из `templates/service.yaml` получается `Service`.
6. Из `templates/configmap.yaml` получается `ConfigMap`.
7. Helm отправляет эти манифесты в кластер через Kubernetes API в namespace `default`.

Для этого проекта команда выше делает следующее:

- создает или обновляет release с именем `demo`;
- создает `Deployment` с именем `demo-test-app`;
- подставляет образ `26378ada-charming-titania.registry.twcstorage.ru/demo/test-app:1.0.1`;
- добавляет `imagePullSecrets`, чтобы pod смог скачать приватный образ из registry;
- создает `Service`, через который приложение становится доступно в кластере и через `LoadBalancer`.

Если release `demo` еще не существует, Helm установит его с нуля. Если уже существует, Helm обновит существующие ресурсы.

Проверка релиза:

```bash
kubectl get pods,svc
kubectl rollout status deployment/demo-test-app
```

Если сервис типа `LoadBalancer` получил внешний IP, приложение обычно доступно по этому адресу напрямую:

```bash
kubectl get svc -n default
```

Смотри значение в колонке `EXTERNAL-IP`. Если у сервиса `demo-test-app` указан внешний адрес, открой в браузере:

```text
http://<EXTERNAL-IP>
```

Если у балансировщика настроен не `80` порт, тогда используй:

```text
http://<EXTERNAL-IP>:<PORT>
```

В этом chart по умолчанию сервис слушает `80`, поэтому чаще всего достаточно просто открыть IP балансировщика без дополнительного порта.

Если `LoadBalancer` не выдает внешний IP, есть два быстрых варианта:

1. временно переключить сервис в `NodePort`;
2. сделать port-forward:

```bash
kubectl port-forward svc/demo-test-app 8080:80
```

## 8. Показать изменение конфигурации без пересборки

Это второй важный сценарий лабы: React-код не меняется, меняются только values/env.

Пример обновления runtime-конфига:

```bash
helm upgrade --install demo ./helm/test-app \
  -n default \
  --set image.repository=26378ada-charming-titania.registry.twcstorage.ru/demo/test-app \
  --set image.tag=1.0.1 \
  --set 'imagePullSecrets[0].name=craas-26378ada-charming-titania' \
  --set appConfig.title="Timeweb Demo" \
  --set appConfig.environment="prod" \
  --set appConfig.banner="This text came from Helm values" \
  --set appConfig.version="1.0.1" \
  --set appConfig.highlightLabel="Config updated without rebuild"
```

После обновления страницы увидишь новый banner, environment и label без пересборки frontend bundle.

Если после `helm upgrade` значения в интерфейсе не поменялись, перезапусти deployment вручную, потому что в текущем chart обновление `ConfigMap` само по себе не всегда приводит к перезапуску pod:

```bash
kubectl rollout restart deployment/demo-test-app -n default
kubectl rollout status deployment/demo-test-app -n default
```

## 9. Полезный сценарий показа целиком

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

## 10. Полезные команды

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
