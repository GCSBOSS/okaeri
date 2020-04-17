# [Okaeri](https://gitlab.com/GCSBOSS/okaeri)

The RESTful microservice for managing user accounts and authentication

- [Simple REST API](#api-reference)
- [Highly configurable](#configuration-reference)
- [Complete event log](#logging)
- [Webhooks for all important events](#webhooks)

## Run Locally

1. Install Nodecaf CLI with `npm i -g okaeri`
2. Optionally create a TOML [config file](#configuration).
3. Setup your MongoDB instance on localhost:27017
4. Run in the terminal with: `okaeri /my/conf/file.toml`.

## Get Started with Docker

The official image repository in Docker Hub is `gcsboss/okaeri`.

Run like this: `docker run -p 7667:7667 -v /your/conf.toml:/conf.toml gcsboss/okaeri -c /conf.toml`

## API Reference

The following endpoints are supported so far:

- `POST /account`: Create a new account
  - Expects a JSON payload contaning a `name` string and a strong `password` string.
  - If successful responds with account id


- `POST /auth`: Verifies whether a password and name match an active account.
  - Expects a JSON payload contaning a correct `name` and `password` for the account being verified.
  - If successful responds with account id

- `GET /account/:id`: Fetch given account info
  - Expects the account id as parameter (is is returned on acocunt creation).
  - If successful responds with JSON contaiing accout info.

- `GET /identity`: Fetch your account data based on header
  - Expects the account id as a header (see configuration `identityHeader`).
  - If successful responds with JSON contaiing accout info.


## Configuration Reference

This are all the avaiable settings to be defined in your `conf.toml`.

```toml
# Define the server port
port = 7667 # Defaults to 7667

identityHeader = 'X-My-Id' # defaults to empty

# Setup your connection to mongodb
[mongo]
url = 'mongodb://localhost:27017/' # Defaults to localhost on port 27017
name = 'MyDBName' # Defaults to "Okaeri"

```

### Logging

Okaeri can log all events in JSON format so you may easily parse and trsnaform it
as per your needs. You can also tweak the log level so you get only the
right informatin for you.

Available log levels are: `debug`, `info`, `warn`, `error`, `fatal`.

```toml
[log]
level = 'debug' # Defaults to "info"
file = '/home/me/okaeri.log' # Defaults to the project installation dir
```

### Webhooks

You can setup webhooks to be triggered whenever important events happen within
Okaeri. By default all webhooks are sent as:
- POST requests
- Payload contains JSON with event data
- Header 'X-Okaeri-Event' caintains the event type

Check the supported events so far:

```toml
[hooks]
onCreateAccount = 'http://example.com/let/me/know'
```

## Reporting Bugs
If you have found any problems with this module, please:

1. [Open an issue](https://gitlab.com/GCSBOSS/okaeri/issues/new).
2. Describe what happened and how.
3. Also in the issue text, reference the label `~bug`.

We will make sure to take a look when time allows us.

## Proposing Features
If you wish to get that awesome feature or have some advice for us, please:
1. [Open an issue](https://gitlab.com/GCSBOSS/okaeri/issues/new).
2. Describe your ideas.
3. Also in the issue text, reference the label `~proposal`.

## Contributing
If you have spotted any enhancements to be made and is willing to get your hands
dirty about it, fork us and
[submit your merge request](https://gitlab.com/GCSBOSS/okaeri/merge_requests/new)
so we can collaborate effectively.
