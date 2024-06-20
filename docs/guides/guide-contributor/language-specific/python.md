# Python guidelines

For any [Python][py] code, please stick to the guidelines described in this
section.

## Python version

For any new projects, please use one of the two most recent [Python minor
versions][py-downloads]. For existing projects, use the Python version used
throughout the project (mentioned in `pyproject.toml`).

## Dependency management

### pyproject.toml

Use [`poetry`][py-poetry] for dependency management. Use the `pyproject.toml`
file to specify the dependencies. Do not use `requirements.txt` files. Use
`poetry.lock` to lock the dependencies and commit it to the repository.

Preferably, segregate dependencies for different tasks. For example, use
`[tool.poetry.test.dependencies]` for testing dependencies, and
`[tool.poetry.dependencies]` for runtime dependencies.

```python
poetry add <package> --group=<group>
```

> **Note**: It is preferable to sort toml files alphabetically. This makes it
> easier to find dependencies and fields, you can use the poetry 
> plugin or external toml sorters.

### Console script
If your project has an entry point, use `pyproject.toml` file to define console
scripts.

```toml
[tool.poetry.scripts]
<name> = "<module>:<function>"
```

### Build system

Use `poetry build` to build the project. Do not use `setup.py` or `setup.cfg`.

## Code formatting and linting

### Ruff
In an effort to reduce dependencies, we recommend using [`ruff`][py-ruff]. Add strictness
based on the project requirements, but at least use the following:

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

> **Note**: You can fix lints by running `ruff check --fix <Path>` and
> `ruff format <Path>` to format the code.

### Docstrings

With pydocstyle, you can enforce the Google-style docstrings. Add the following
to the `pyproject.toml` file:

```toml
[tool.ruff.lint.pydocstyle]
convention = "google"
```

The above will enforce Google-style docstrings. It is recommended to add at least
`Arguments`, `Args`, `Returns`, `Raises` and `Example` sections to classes, methods 
whereever possible.

## Type hints

Add [type hints][py-typing] to _all_ function and method signatures, as well as
any global variables. Adding type hints to local variables is recommended.
Adding type hints to (unit) tests is not necessary.

### static type checkers

please use [`mypy`][py-mypy] to check the type hints. 

## Testing

Use [`pytest`][py-pytest] as a test runner for unit tests. You can determine
the test coverage with the [`coverage`][py-cov] package. Strive for a test
coverage of 100% for new projects. Proposed code changes should never reduce
the previous test coverage.
