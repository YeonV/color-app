```sh
git clone
npm i
npm run dev
```
open some tabs:

multiple: http://localhost:3000 (clientId onBlur)

onetime: http://localhost:3000/drone

idea:
multiple clients, one master (drone)
clients can update their own color and position
drone can update color and position of each client

state:
currently all is handled via http requests.
so no realtime updates. needs refresh page to see changes

todo:  move everything to websockets, to make update sync in realtime
