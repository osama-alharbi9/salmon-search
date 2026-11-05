# salmon: `make install`, then `make data`, then `make run`.
PYTHON ?= python3.12
VENV   := $(CURDIR)/backend/.venv
BIN    := $(VENV)/bin
API_PORT ?= 8000
UI_PORT  ?= 3000

.DEFAULT_GOAL := help
.PHONY: help install data fetch build-data api lint

help:
	@echo "install      create backend/.venv, install Python dependencies, create backend/.env"
	@echo "data         download the TVTropes dump (about 6 GB) and build everything"
	@echo "fetch        download the dump only"
	@echo "build-data   build artifacts and embeddings from a dump already on disk"
	@echo "api          start the API (:8000)"
	@echo "lint         run ruff"

install:
	$(PYTHON) -m venv $(VENV)
	$(BIN)/pip install --upgrade pip
	$(BIN)/pip install -r backend/requirements-dev.txt
	@test -f backend/.env || cp backend/.env.example backend/.env

data: fetch build-data

fetch:
	cd backend && $(BIN)/python -m salmon.fetch

build-data:
	cd backend && $(BIN)/python -m salmon.parse
	cd backend && $(BIN)/python -m salmon.profiles
	cd backend && $(BIN)/python -m salmon.enrich
	cd backend && $(BIN)/python -m salmon.embed

api:
	cd backend && $(BIN)/uvicorn app.main:app --port $(API_PORT)

lint:
	cd backend && $(BIN)/ruff check .
