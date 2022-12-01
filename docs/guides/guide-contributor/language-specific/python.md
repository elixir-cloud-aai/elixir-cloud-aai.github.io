# Python guidelines

For any [Python][py] code, please stick to the guidelines described in this
section.

## Python version

For any new projects, please use one of the two most recent [Python minor
versions][py-downloads]. For existing projects, use the Python version used
throughout the project.

## Code formatting

Please format the code using [`black`][py-black] and default parameters. Where
[`black`][py-black] is not prescriptive, please use a consistent coding style.
In particular, when contributing to an existing code base, please adhere to the
coding style you find. In all cases, please adhere to [PEP 8][py-pep8].

## Docstrings

Please add [Google-style docstrings][py-doc-google] to _all_ modules, functions
and methods. Follow [PEP 257][py-pep257]. Do not include types in the
docstrings.

## Type hints

Add [type hints][py-typing] to _all_ function and method signatures, as well as
any global variables. Adding type hints to local variables is recommended.
Adding type hints to (unit) tests is not necessary.

## Linters & static type checkers

Please make use of the following tools with default parameters to make sure
your code is of good quality:

- [`flake8`][py-flake8]
- [`flake8-docstring`][py-flake8-doc]
- [`pylint`][py-pylint]
- [`mypy`][py-mypy]

When disabling rules is required, it is preferable to do so in-line, rather
than globally.

## Testing

Use [`pytest`][py-pytest] as a test runner for unit tests. You can determine
the test coverage with the [`coverage`][py-cov] package. Strive for a test
coverage of 100% for new projects. Proposed code changes should never reduce
the previous test coverage.
