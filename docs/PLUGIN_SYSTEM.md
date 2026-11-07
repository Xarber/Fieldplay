# Extension boundaries

The current application contains built-in rule modules, a typed validated command contract, shared authority/projection boundaries and separate map/RTC/storage/install platform adapters. These are explicit places to add approved modes, abilities, UI sections, data providers and transport integrations without duplicating geospatial or scoring systems.

There is no third-party executable plugin loader, marketplace, unrestricted WebView code, or dynamic code evaluation. Imported game presets contain bounded versioned data and can select only built-in modes. Do not describe a complete plugin runtime as implemented.

A future host-controlled registry must version manifests/APIs, declare capabilities, enforce per-plugin storage/network/UI permissions, provide enable/disable and lifecycle boundaries, and isolate faults. It must receive authorized player projections, not raw authority secrets. An extension's presence in the UI is never authorization for GPS, private ideas or session credentials. Official-store variants must exclude incompatible capabilities at build time, not hide them after review.
