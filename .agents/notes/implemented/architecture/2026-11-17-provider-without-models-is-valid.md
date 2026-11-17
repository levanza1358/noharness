# Agent Note: A declared provider may name no models

Status: implemented

## Problem

The Providers settings page creates a provider from a name, an endpoint, a protocol, and a key; models are added on the Models page. `llm-pi-ai` refused an empty `models` list on a route the installed catalog does not describe, so creating a provider without models failed as a configuration fault and the create form had to demand a model the user had not chosen.

## Decision

An empty `models` list on a route the installed catalog does not describe is configuration state, not a fault: `resolveRouteModels` returns an empty catalog with no diagnostic, so a write succeeds and a stored read reports no `error` on the route.

The two facts nothing else can default stay required: such a route still needs `api` and `baseURL`, and a write refuses one that names neither. Everything else about the route — credential, headers, retry policy — validates as before.

A route with no models serves nothing until one arrives; `listModels` returns an empty list and a request for any model fails with `UNKNOWN_MODEL`. That is the same posture as a route whose credential is missing, which this package already models as a live but unusable route rather than a settings error.

## Alternatives considered

**Keep refusing empty catalogs on write and let the create form require a model.** That contradicts the split of the two pages — the provider profile is complete without a model list — and forces the create form to invent a model the user had not chosen.

## Consequences

Creating a provider on the Providers page succeeds without a model list, and the Models page owns every model the route later serves. The refusal moves from the write to the request: a caller that asks such a route for a model receives `UNKNOWN_MODEL` rather than a settings diagnostic. Tests cover the accepting write, the empty `listModels` result, and the still-required `api` and `baseURL`.
