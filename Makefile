default: help

.PHONY: help
help:
	@echo "\nUsage: make [target] ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\n"
	@echo "Available targets:\n"

	@echo "Environment Management --------------------------------------------------------"
	@echo "  \033[1m\033[35mclean-venv\033[0m \033[37m(cv)\033[0m: \033[36mRemove virtual environment.\033[0m"
	@echo "  \033[1m\033[35minstall\033[0m \033[37m(i)\033[0m: \033[36mInstall dependencies and {{ cookiecutter.project_slug }}.\033[0m"
	@echo "  \033[1m\033[35mvenv\033[0m \033[37m(v)\033[0m: \033[36mCreate virtual environment.\033[0m\n"

	@echo "Documentation -----------------------------------------------------------------"
	@echo "  \033[1m\033[35mdocs\033[0m \033[37m(d)\033[0m: \033[36mGenerate project documentation.\033[0m\n"

.PHONY: clean-venv
clean-venv:
	@echo "\nRemoving the virtual environment ++++++++++++++++++++++++++++++++++++++++++++++\n"
	@rm -rf .venv

.PHONY: cv
cv: clean-venv

.PHONY: docs
docs:
	@echo "\nGenerating project documentation ++++++++++++++++++++++++++++++++++++++++++++++\n"
	@mkdocs build

.PHONY: d
d: docs

.PHONY: install
install:
	@echo "\nInstalling dependencies and with this package +++++++++++++++++++++++++++++++++\n"
	@poetry install --no-root

.PHONY: i
i: install

.PHONY: venv
venv:
	@echo "\nCreating a virtual environment ++++++++++++++++++++++++++++++++++++++++++++++++\n"
	@python -m venv .venv
	@echo "\nSummary +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\n"
	@echo "Virtual environment created successfully."
	@echo "To activate the environment for this shell session, run:"
	@echo "source .venv/bin/activate"

.PHONY: v
v: venv