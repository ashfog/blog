---
title: "WeatherNext Cyclones Extends Tropical Cyclone Forecast Skill by About 24 Hours"
description: "Google DeepMind says its new WeatherNext cyclone system makes three-day forecasts as accurate as previous two-day guidance, a gain researchers compare with roughly a decade of forecasting progress."
publishedAt: 2026-08-08T11:55:00Z
category: research
tags:
  - google-deepmind
  - weathernext
  - tropical-cyclones
  - ai-weather-forecasting
featured: false
sources:
  - title: "WeatherNext: AI model achieves breakthrough in forecasting cyclones"
    url: "https://deepmind.google/blog/weathernext-ai-model-achieves-breakthrough-in-forecasting-cyclones/"
  - title: "How WeatherNext helped the National Hurricane Center better predict Hurricane Melissa’s historic landfall in Jamaica"
    url: "https://deepmind.google/blog/how-weathernext-helped-the-national-hurricane-center-better-predict-hurricane-melissas-historic-landfall-in-jamaica/"
  - title: "How we're supporting better tropical cyclone prediction with AI"
    url: "https://deepmind.google/blog/how-were-supporting-better-tropical-cyclone-prediction-with-ai/"
  - title: "DeepMind Says Its AI Can Predict Hurricanes Earlier Than Everyone Else"
    url: "https://www.wired.com/story/deepmind-ai-model-can-predict-hurricanes-earlier/"
---

Google DeepMind’s latest tropical-cyclone forecasting result is best understood as a gain in **usable lead time**, not simply a longer maximum forecast horizon.

In its [August 2026 announcement](https://deepmind.google/blog/weathernext-ai-model-achieves-breakthrough-in-forecasting-cyclones/), DeepMind said its WeatherNext system reached state-of-the-art accuracy for tropical-cyclone track, intensity, and wind structure. The headline comparison is unusually concrete: a WeatherNext forecast made **three days in advance can be about as accurate as what earlier leading systems could provide only two days in advance**. In practical terms, that is roughly an extra 24 hours in which forecasters and emergency managers can act on guidance of comparable quality.

DeepMind describes that improvement as roughly equivalent to **a decade of historical progress in meteorological forecasting**. That comparison should be read as a statement about forecast-skill improvement, not as a claim that one AI model replaces ten years of weather science. The more important point is operational: in hurricane forecasting, one additional day of reliable information can change when evacuations begin, where supplies are staged, and how confidently officials prepare for rapid intensification.

## What WeatherNext Cyclones actually improves

Tropical cyclones are difficult because forecasters must solve several related problems at once.

A storm’s **track** depends heavily on large-scale atmospheric patterns: pressure systems, steering winds, fronts, and circulation spanning huge geographic areas. Its **intensity**, however, is influenced by much smaller-scale processes inside and around the storm, including convection, ocean heat, moisture, and the structure of the cyclone core.

Historically, that created a trade-off. Large global models were strong at seeing the broad atmospheric environment that controls a storm’s path, while high-resolution regional models were often better suited to representing the fine-scale physics related to strength. Earlier AI weather models also tended to perform better on track than on intensity.

WeatherNext is designed to narrow that gap. In its [account of Hurricane Melissa](https://deepmind.google/blog/how-weathernext-helped-the-national-hurricane-center-better-predict-hurricane-melissas-historic-landfall-in-jamaica/), Google says the system was developed by **Google DeepMind and Google Research**, using decades of global weather data together with specialized tropical-cyclone data. The resulting model is intended to forecast track and intensity together rather than treating one as an afterthought.

This is also where the phrase “with multiple institutions” needs some precision. The core model was developed inside Google, while the work has been tested and improved through collaboration with operational and research partners. DeepMind has [worked with forecasting organizations](https://deepmind.google/blog/how-were-supporting-better-tropical-cyclone-prediction-with-ai/) including the **U.S. National Hurricane Center (NHC)**, the **Cooperative Institute for Research in the Atmosphere (CIRA) at Colorado State University**, the **UK Met Office**, the **University of Tokyo**, **Weathernews**, and other forecasting experts. These organizations are important collaborators and evaluators, but official public warnings still come from national meteorological agencies, not from Google.

## The extra day is the key result

Weather forecasts do not suddenly become “correct” or “incorrect” at a fixed horizon. Skill degrades as lead time increases. That is why the most meaningful comparison is not whether a model can generate a 10-day or 15-day forecast, but how much useful accuracy remains several days ahead.

DeepMind’s new result effectively shifts that skill curve outward.

If an older system reached a certain level of track-and-intensity accuracy at two days, WeatherNext can reach approximately the same level at three days. [WIRED’s report on the Nature research](https://www.wired.com/story/deepmind-ai-model-can-predict-hurricanes-earlier/) summarized the result as an average **one-day gain in lead time** over existing models.

That distinction matters because DeepMind’s cyclone systems were already capable of generating forecasts well beyond three days. In 2025, the company [demonstrated experimental cyclone scenarios through Weather Lab](https://deepmind.google/blog/how-were-supporting-better-tropical-cyclone-prediction-with-ai/) out to 15 days. The 2026 advance is therefore not “the forecast now goes from two days to three days.” It is that **three-day guidance has reached the quality previously associated with two-day guidance**.

For emergency planning, those are very different claims.

## Hurricane Melissa showed why 24 hours matters

The strongest real-world example came during the 2025 Atlantic hurricane season.

When Hurricane Melissa was still a much weaker system, forecast models disagreed about whether it would remain relatively weak or intensify sharply on a path toward Jamaica. [According to DeepMind](https://deepmind.google/blog/how-weathernext-helped-the-national-hurricane-center-better-predict-hurricane-melissas-historic-landfall-in-jamaica/), WeatherNext predicted a Category 5-strength landfall in Jamaica **five days in advance with about 80% confidence**, rising to nearly 100% three days before landfall.

The National Hurricane Center ultimately made a historic forecast: it predicted that Melissa would reach Category 5 intensity while the storm was still at Category 1 wind speed. DeepMind says WeatherNext was one of the guidance sources supporting that decision, alongside physics-based models, satellite observations, hurricane-hunter data, and expert analysis.

That last part is essential. WeatherNext did not autonomously issue the warning. It contributed another high-value signal to a professional forecasting process.

The NHC’s role illustrates the likely near-term future of AI weather systems. Rather than replacing meteorologists, AI models can expand the set of scenarios experts can examine, produce probabilistic forecasts quickly, and provide additional independent guidance when traditional models disagree.

## From 50 scenarios to much larger ensembles

Another advantage of AI forecasting is computational speed.

Traditional numerical weather prediction solves large systems of physical equations repeatedly on expensive supercomputers. AI models still require significant compute to train, but once trained they can often generate forecasts much faster.

That speed makes large ensembles practical. An ensemble does not give one deterministic future; it generates many plausible futures, allowing forecasters to see how sensitive the storm may be to small changes in initial conditions.

DeepMind’s 2025 cyclone system produced ensembles of 50 scenarios. [WIRED reports](https://www.wired.com/story/deepmind-ai-model-can-predict-hurricanes-earlier/) that the newer system can generate as many as **1,000 possible storm scenarios**. For a cyclone that could either weaken, turn, or rapidly intensify, the distribution of those outcomes can be more useful than a single “best guess.”

This is one of the areas where AI may provide a structural advantage rather than merely copying conventional forecasting more cheaply.

## Open sourcing changes the research value

DeepMind is also [opening the models used in its hurricane-season work](https://deepmind.google/blog/weathernext-ai-model-achieves-breakthrough-in-forecasting-cyclones/), including **WeatherNext 2 and WeatherNext Cyclones**, so outside researchers can study and build on them.

That matters for two reasons.

First, tropical cyclones are rare relative to ordinary weather. Machine-learning systems normally benefit from enormous quantities of training examples, but there are only so many well-observed major hurricanes and typhoons. Broader research access can help scientists test the model across basins, historical storms, unusual intensification events, and different observational regimes.

Second, researchers still do not fully understand why WeatherNext can infer so much about cyclone intensity from comparatively coarse atmospheric inputs. [WIRED reported](https://www.wired.com/story/deepmind-ai-model-can-predict-hurricanes-earlier/) that even members of the DeepMind team see this as an open scientific question. If the model has learned predictive signals that conventional cyclone modeling has underused, analyzing those signals could contribute to meteorology itself rather than only to forecast automation.

Open weights and code do not automatically make a model operationally trustworthy, but they make independent evaluation much easier.

## What the result does not mean

The 24-hour improvement is significant, but it should not be interpreted as a guarantee that WeatherNext will be the best model for every storm.

Cyclones are highly variable. A model that performs exceptionally across one season or benchmark can still fail on an unusual event. Forecasting also involves more than track and maximum wind speed: rainfall, storm surge, local terrain, infrastructure vulnerability, and the timing of impacts can determine the actual danger to communities.

There is also an important distinction between **model guidance** and an **official forecast**. DeepMind’s [public guidance](https://deepmind.google/blog/how-were-supporting-better-tropical-cyclone-prediction-with-ai/) directs people to local meteorological agencies for warnings. The NHC and similar organizations combine multiple models with live observations and forecaster judgment before issuing public guidance.

The most credible interpretation of WeatherNext Cyclones is therefore not that AI has “solved hurricanes.” It is that AI has become a genuinely useful component of the forecasting stack, including one of the hardest parts of the problem: predicting both where a cyclone will go and how strong it will become.

## Why this is a meaningful AI milestone

Much of the public AI conversation focuses on chatbots, coding agents, and media generation. WeatherNext is a different category of progress: machine learning applied to a physical system where improved predictions have direct consequences for infrastructure and human safety.

An extra day does not sound dramatic in isolation. In tropical-cyclone response, it can be substantial.

Twenty-four additional hours can mean more time to evacuate vulnerable areas, reposition emergency crews, secure ports and airports, prepare hospitals, protect power infrastructure, and communicate risk before roads become congested or conditions deteriorate.

That is why the “three days as good as two” result is more important than a flashy maximum forecast horizon. WeatherNext Cyclones is not simply predicting farther into the future. It is attempting to move **high-confidence decision time** farther into the future.

If that performance holds across future seasons and different ocean basins, the model’s most important output may not be a better forecast map. It may be an additional day in which people can do something useful with it.
