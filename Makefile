# salmon: `make install`, then `make data`, then `make run`.
PYTHON ?= python3.12
VENV   := $(CURDIR)/backend/.venv
BIN    := $(VENV)/bin
API_PORT ?= 8000
UI_PORT  ?= 3000

.DEFAULT_GOAL := help
.PHONY: help install lint

help:
	@echo "install      create backend/.venv, install Python dependencies"
	@echo "lint         run ruff"

install:
	$(PYTHON) -m venv $(VENV)
	$(BIN)/pip install --upgrade pip
	$(BIN)/pip install -r backend/requirements-dev.txt

lint:
	cd backend && $(BIN)/ruff check .
