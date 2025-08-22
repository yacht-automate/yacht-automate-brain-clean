# Yacht Automate - Brain API

A production-lean yacht charter automation engine that processes leads, matches yachts, calculates quotes, and automates email responses.

## Overview

Yacht Automate Brain is an API-only service designed for yacht charter businesses to automate their lead processing workflow:

- **Lead Processing**: Accept leads via API or email ingestion
- **Intent Parsing**: Extract location, dates, guest count, and preferences
- **Yacht Matching**: Match leads to yachts from built-in knowledge base
- **Quote Calculation**: Generate detailed charter cost breakdowns
- **Email Automation**: Send personalized responses with yacht options

## Features

- 🏗️ **Multi-tenant Architecture**: Support multiple charter companies
- 🔍 **Intelligent Matching**: Score-based yacht matching algorithm
- 💰 **Quote Engine**: Accurate charter cost calculations (base + APA + VAT)
- 📧 **Email Automation**: SMTP integration with console fallback
- 📊 **Full Observability**: Comprehensive logging and event tracking
- 🔒 **Security**: Admin key protection and rate limiting
- ⚡ **Performance**: SQLite database with optimized queries

## Quick Start

### 1. Install Dependencies

```bash
npm install
