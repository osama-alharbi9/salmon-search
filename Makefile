# salmon: `make install`, then `make data`, then `make run`.
PYTHON ?= python3.12
VENV   := $(CURDIR)/backend/.venv
BIN    := $(VENV)/bin
API_PORT ?= 8000
UI_PORT  ?= 3000

.DEFAULT_GOAL := help
.PHONY: help install data fetch build-data sample-data api ui run test lint

help:
	@echo "install      create backend/.venv, install Python and Node dependencies, create backend/.env"
	@echo "data         download the TVTropes dump (about 6 GB) and build everything"
	@echo "fetch        download the dump only"
	@echo "build-data   build artifacts and embeddings from a dump already on disk"
	@echo "sample-data  build a tiny demo dataset from the test fixtures instead"
	@echo "run          start the API (:8000) and the web UI (:3000)"
	@echo "api, ui      start one of them"
	@echo "test         run the backend tests (fast, offline)"
	@echo "lint         run ruff and eslint"

install:
	$(PYTHON) -m venv $(VENV)
	$(BIN)/pip install --upgrade pip
	$(BIN)/pip install -r backend/requirements-dev.txt
	cd frontend && npm ci
	@test -f backend/.env || cp backend/.env.example backend/.env

data: fetch build-data

fetch:
	cd backend && $(BIN)/python -m salmon.fetch

build-data:
	cd backend && $(BIN)/python -m salmon.parse
	cd backend && $(BIN)/python -m salmon.profiles
	cd backend && $(BIN)/python -m salmon.enrich
	cd backend && $(BIN)/python -m salmon.embed

sample-data:
	SALMON_DATA_DIR=tests/fixtures/raw $(MAKE) build-data

api:
	cd backend && $(BIN)/uvicorn app.main:app --port $(API_PORT)

ui:
	cd frontend && npm run dev -- --port $(UI_PORT)

run:
	$(MAKE) -j2 api ui

test:
	cd backend && $(BIN)/python -m pytest
	cd frontend && npm test

lint:
	cd backend && $(BIN)/ruff check .
	cd frontend && npm run lint
