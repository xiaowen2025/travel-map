Scrape and combine cruise deals from multiple sources to find the cheapest Mediterranean cruises.

## Usage

```
/daily_routine
```

## What it does

Runs three workflows in sequence:

1. **Feed** (`workflows/workflows/routines/feed/daily-feed-generation.md`) — Aggregates feed data, scores and ranks items by breadth/durability/novelty, generates a daily digest
2. **Cruise Deals** (`workflows/workflows/routines/cruise_deals/find-cruise-deals.md`) — Scrapes 3 sources (seascanner.co.uk, seascanner.com, mydealz.de), combines results, detects price changes
3. **Travel Deals** (`workflows/workflows/routines/travel_deals/find-dealz-travel-deals.md`) — Finds travel deals

## Run

Execute all three workflows in sequence. Come back with a concise summary if anything new and significant.
