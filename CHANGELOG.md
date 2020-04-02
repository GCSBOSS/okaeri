# Okaeri Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v0.0.3] - 2020-04-02

### Added
- endpoints to fetch account data based on header and on parameter

### Changed
- create and auth endpoints to respond with account id

## [v0.0.2] - 2020-02-13

### Added
- mongodb unique index to account name

### Fixed
- error of missing config file when running from docker
- docker exposed port
- warning from mongo client settings

### Changed
- logging system to new nodecaf (12 factor) stdout logging

## [v0.0.1] - 2020-01-18

First officially released version

[v0.0.1]: https://gitlab.com/GCSBOSS/okaeri/-/tags/v0.0.1
[v0.0.2]: https://gitlab.com/GCSBOSS/okaeri/-/tags/v0.0.2
[v0.0.3]: https://gitlab.com/GCSBOSS/okaeri/-/tags/v0.0.3
