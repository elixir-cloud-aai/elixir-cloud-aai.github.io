# Python guidelines

For all [Python][py] code, please stick to the guidelines described in this
section.

## Python version

For any _new_ projects, please use one of the two most recent [Python minor
versions][py-downloads], exclusing pre-releases. For existing projects, use the
Python version used throughout the project (mentioned in `pyproject.toml`).

## Packaging, build system & dependencies

Please use [`pyproject.toml`][py-toml] to configure packaging, building, and
dependency management. Please do not use `setup.py` and do no specify your
dependencies in `requirements.txt`, except for legacy projects where they are
still used.

Preferably, segregate dependencies for different tasks. For example, use
`[tool.poetry.test.dependencies]` for testing dependencies, and
`[tool.poetry.dependencies]` for runtime dependencies.

Please sort entries (sections, dependencies) in `pyproject.toml` alphabetically
to ease maintenance. If using Poetry (see below), you can use the
[`poetry-sort`][py-poetry-sort] plugin to help with this. Otherwise any other
TOML sorter should work as well.

> **Note**: We strongly recommend using the [Poetry][py-poetry] package manager
> instead of `pip`. In that case, use `poetry.lock` to lock the dependencies
> (make > sure to commit the file to version control). To add a new dependency,
> use the following command:
>
> ```python
> poetry add <package> --group=<group>
> ```
>
> To build the project, use:
>
> ```python
> poetry build
> ```

### Console scripts

If your project has one or more console script entry points, use
`pyproject.toml` file to define them, e.g.:

```toml
[tool.poetry.scripts]
my-script = "my_package.my_module.my_submodule:my_function"
```

## Code formatting and linting

### Ruff

In an effort to reduce dependencies, we recommend using [`ruff`][py-ruff] for
new projects and configuring it in `pyproject.toml`. Configure strictness based
on project requirements, but at least use the following:

```toml
[tool.ruff.lint]
select = [
  "B", # flake8-bugbear
  "D", # pydocstyle
  "E", # pycodestyle
  "F", # Pyflakes
  "I", # isort
  "PL", # pylint
  "SIM", # flake8-simplify
  "UP", # pyupgrade
]
```

> **Note**: You can fix lints by running `ruff check --fix <Path>` and `ruff
> format <Path>` to format the code.

### Docstrings

Please use [Google-style docstrings][py-doc-google] for all packages, modules,
classes, methods and functions. With `pydocstyle`, you can enforce this style
with the following entry in the `pyproject.toml` file:

```toml
[tool.ruff.lint.pydocstyle]
convention = "google"
```

For **methods and functions**, please include at least the following sections,
where applicable:

- `Args`
- `Returns` (or `Yields`, for generator functions)
- `Raises`

For **classes**, please include the `Attributes` section.

Furthermore, in all cases, consider including `Examples` and `Note` sections.

## Type hints

Add [type hints][py-typing] to _all_ function and method signatures, as well as
any global variables. Adding type hints to local variables is recommended if
types aren't obvious from assignments.

Adding type hints to (unit) tests is not necessary.

> **Note**: You can try using [MonkeyType][py-monkey-type] to help with adding
> type hints to your code.

### Static type checkers

Please use a type checker to check for type consistency across your project. We
recommend using [`mypy`][py-mypy], but alternatives are acceptable.

## Testing

Please provide extensive tests (both unit and integration) for your code and
determine the test coverage with the [`coverage`][py-cov] package. Strive
for a test coverage of 100% for unit and 70% for integration tests, because:

> Untested code is broken code.

Please use [`pytest`][py-pytest] as a runner for your tests (it also comes with
many useful features and extensions).

Be aware that proposed code changes **must never** reduce the previous test
coverage.
