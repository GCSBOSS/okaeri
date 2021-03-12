# Okaeri Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v0.1.3] - 2021-03-12

### Fixed
- accounts query always including id ordering
- groups query always including id ordering

## [v0.1.2] - 2021-03-04

### Added
- function to check whether an account belongs to any given groups

### Fixed
- `accounts` field from group not returned correctly on `readGroup()`

## [v0.1.1] - 2021-03-03

### Added
- account group functionality
- account iteration feature

## [v0.1.0] - 2020-12-10

### Changed
- the entire project and API to a whole new direction

## [v0.0.6] - 2020-11-24

### Fixed
- add missing TOML dependency

## [v0.0.5] - 2020-11-24

### Fixed
- reduced footprint due to upgrade of nodecaf version

## [v0.0.4] - 2020-04-17

### Fixed
- deployment process along with nodecaf version

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
[v0.0.4]: https://gitlab.com/GCSBOSS/okaeri/-/tags/v0.0.4
[v0.0.5]: https://gitlab.com/GCSBOSS/okaeri/-/tags/v0.0.5
[v0.0.6]: https://gitlab.com/GCSBOSS/okaeri/-/tags/v0.0.6
[v0.1.0]: https://gitlab.com/GCSBOSS/okaeri/-/tags/v0.1.0
[v0.1.1]: https://gitlab.com/GCSBOSS/okaeri/-/tags/v0.1.1
[v0.1.2]: https://gitlab.com/GCSBOSS/okaeri/-/tags/v0.1.2
[v0.1.3]: https://gitlab.com/GCSBOSS/okaeri/-/tags/v0.1.3
