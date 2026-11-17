# A declared provider may name no models

The Providers settings page creates a provider from a name, an endpoint, a
protocol, and a key; models are added on the Models page. `llm-pi-ai` therefore
treats an empty `models` list on a route the installed catalog does not describe
as configuration state, not a fault: `resolveRouteModels` returns an empty
catalog with no diagnostic, so a write succeeds and a stored read reports no
`error` on the route.

The two facts nothing else can default stay required: such a route still needs
`api` and `baseURL`, and a write refuses one that names neither. Everything else
about the route — credential, headers, retry policy — validates as before.

A route with no models serves nothing until one arrives; `listModels` returns an
empty list and a request for any model fails with `UNKNOWN_MODEL`. That is the
same posture as a route whose credential is missing, which this package already
models as a live but unusable route rather than a settings error.

Rejected alternative: keep refusing empty catalogs on write and let the create
form require a model. That contradicts the split of the two pages — the provider
profile is complete without a model list — and forced the create form to invent
a model the user had not chosen.
