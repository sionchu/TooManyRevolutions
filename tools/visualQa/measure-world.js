/*
 * TMR Integration Visual QA helper
 *
 * Paste this file into the browser console. It is intentionally standalone:
 * it reads the live page, temporarily adds a selection overlay when asked,
 * and never writes application state or source files.
 *
 * The important boundary is deliberate:
 * - DOM rects and data attributes are structural/runtime probes.
 * - TERRAIN_OCCUPANCY and MEANINGFUL_WORLD_OCCUPANCY require a reviewer
 *   annotation on the player-visible canvas.
 * - Canvas/WebGL labels, POIs, faction surfaces, and fronts require a
 *   screenshot-blind count through setVisualCounts().
 */
(() => {
  "use strict";

  const ROOT_KEY = "__tmrVisualQa";
  const VERSION = "1.0.0";
  const MAX_PROBE_ELEMENTS = 80;
  const COUNT_KEYS = [
    "labelCount",
    "visiblePoiCount",
    "factionSurfaceCount",
    "frontCount",
    "routeCount",
  ];

  const previous = globalThis[ROOT_KEY];
  if (previous && typeof previous.destroy === "function") {
    previous.destroy();
  }

  const state = {
    capture: null,
    annotations: {
      terrain: null,
      meaningful: null,
    },
    screenCounts: Object.fromEntries(COUNT_KEYS.map((key) => [key, null])),
    overlays: new Set(),
    markedPrimaryActions: [],
  };

  const round = (value) =>
    Number.isFinite(value) ? Math.round(value * 100) / 100 : null;

  const positiveNumber = (value) => {
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const nonNegativeInteger = (value, key) => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0) {
      throw new Error(`${key} must be a non-negative integer.`);
    }
    return parsed;
  };

  const rectFromValues = (left, top, width, height) => {
    if (![left, top, width, height].every(Number.isFinite)) return null;
    if (width <= 0 || height <= 0) return null;
    return {
      left: round(left),
      top: round(top),
      right: round(left + width),
      bottom: round(top + height),
      width: round(width),
      height: round(height),
      area: round(width * height),
    };
  };

  const rectFromElement = (element) => {
    if (!element || typeof element.getBoundingClientRect !== "function") {
      return null;
    }
    const rect = element.getBoundingClientRect();
    return rectFromValues(rect.left, rect.top, rect.width, rect.height);
  };

  const viewportRect = () =>
    rectFromValues(0, 0, window.innerWidth || 0, window.innerHeight || 0);

  const clipRect = (source, clip) => {
    if (!source || !clip) return null;
    const left = Math.max(source.left, clip.left);
    const top = Math.max(source.top, clip.top);
    const right = Math.min(source.right, clip.right);
    const bottom = Math.min(source.bottom, clip.bottom);
    return rectFromValues(left, top, right - left, bottom - top);
  };

  const rectanglesOverlap = (first, second) =>
    Boolean(clipRect(first, second));

  // Exact union area for a small list of axis-aligned DOM rectangles.
  const unionArea = (rectangles) => {
    const valid = rectangles.filter(Boolean);
    if (valid.length === 0) return 0;
    const xCoordinates = [
      ...new Set(valid.flatMap((rect) => [rect.left, rect.right])),
    ].sort((a, b) => a - b);
    let area = 0;
    for (let index = 0; index < xCoordinates.length - 1; index += 1) {
      const left = xCoordinates[index];
      const right = xCoordinates[index + 1];
      const width = right - left;
      if (width <= 0) continue;
      const yIntervals = valid
        .filter((rect) => rect.left < right && rect.right > left)
        .map((rect) => [rect.top, rect.bottom])
        .sort((a, b) => a[0] - b[0]);
      let coveredHeight = 0;
      let current = null;
      for (const interval of yIntervals) {
        if (!current) {
          current = [...interval];
        } else if (interval[0] <= current[1]) {
          current[1] = Math.max(current[1], interval[1]);
        } else {
          coveredHeight += current[1] - current[0];
          current = [...interval];
        }
      }
      if (current) coveredHeight += current[1] - current[0];
      area += width * coveredHeight;
    }
    return round(area) || 0;
  };

  const queryAll = (selectors, root = document) => {
    const elements = [];
    for (const selector of selectors) {
      try {
        elements.push(...root.querySelectorAll(selector));
      } catch (error) {
        console.warn(`[${ROOT_KEY}] invalid selector skipped`, selector, error);
      }
    }
    return [...new Set(elements)];
  };

  const visible = (element) => {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    const rect = rectFromElement(element);
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      Number(style.opacity) !== 0 &&
      Boolean(rect)
    );
  };

  const firstElement = (selectors, options = {}) => {
    const elements = queryAll(selectors, options.root || document);
    return (
      elements.find((element) => !options.visibleOnly || visible(element)) ||
      null
    );
  };

  const labelFor = (element) => {
    if (!element) return null;
    const aria = element.getAttribute("aria-label");
    if (aria) return aria.trim();
    const title = element.getAttribute("title");
    if (title) return title.trim();
    const text = element.textContent?.replace(/\s+/g, " ").trim();
    return text ? text.slice(0, 80) : element.tagName.toLowerCase();
  };

  const elementSummary = (element) => ({
    tag: element.tagName.toLowerCase(),
    className: typeof element.className === "string" ? element.className : null,
    label: labelFor(element),
    rect: rectFromElement(element),
  });

  const probeElements = (selectors, canvasRect) => {
    const elements = queryAll(selectors);
    const visibleInCanvas = elements.filter((element) => {
      const rect = rectFromElement(element);
      return visible(element) && rectanglesOverlap(rect, canvasRect);
    });
    return {
      selectors,
      domElementCount: elements.length,
      visibleInCanvasCount: visibleInCanvas.length,
      visibleInCanvas: visibleInCanvas
        .slice(0, MAX_PROBE_ELEMENTS)
        .map(elementSummary),
      note: "DOM probe only; Canvas/WebGL pixels are not counted here.",
    };
  };

  const findMapViewport = () =>
    firstElement(
      [
        ".world-scene-viewport",
        "[data-map-renderer] .world-scene-viewport",
        ".world-scene-canvas",
        "[data-map-renderer]",
        "canvas",
      ],
      { visibleOnly: true },
    );

  const findCanvas = () =>
    firstElement(
      [
        ".world-scene-viewport canvas",
        ".world-scene-canvas canvas",
        "[data-map-renderer] canvas",
        "canvas",
      ],
      { visibleOnly: true },
    );

  const findStage = () =>
    firstElement(
      [".world-stage", '[aria-label="정치 세계 지도"]', ".world-scene-frame"],
      { visibleOnly: true },
    );

  const findVisibleElements = (selectors) =>
    queryAll(selectors).filter((element) => visible(element));

  const readNumberAttribute = (element, name) => {
    if (!element) return null;
    const value = element.getAttribute(name);
    if (value === null || value.trim() === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const readStringAttribute = (element, name) => {
    const value = element?.getAttribute(name);
    return value === null || value === undefined || value === "" ? null : value;
  };

  const sceneSignature = (mapViewport) =>
    [
      readStringAttribute(mapViewport, "data-world-scene-tick"),
      readStringAttribute(mapViewport, "data-camera-focus"),
      readStringAttribute(mapViewport, "data-map-preset"),
      new URLSearchParams(window.location.search).get("mapLabels") || "on",
    ].join("|");

  const runtimeMetadata = (mapViewport) => ({
    source: "DOM data attributes; metadata-not-screen-proof",
    tick: readNumberAttribute(mapViewport, "data-world-scene-tick"),
    cameraFocus: readStringAttribute(mapViewport, "data-camera-focus"),
    mapPreset: readStringAttribute(mapViewport, "data-map-preset"),
    cameraZoom: readNumberAttribute(mapViewport, "data-camera-zoom"),
    mapLod: readStringAttribute(mapViewport, "data-map-lod"),
    runtimeGeometry: readStringAttribute(
      mapViewport,
      "data-map-runtime-geometry",
    ),
    landHexCount: readNumberAttribute(mapViewport, "data-land-hex-count"),
    labelCount: readNumberAttribute(mapViewport, "data-map-label-count"),
    compositionCount: readNumberAttribute(
      mapViewport,
      "data-map-composition-count",
    ),
    assetKitCount: readNumberAttribute(mapViewport, "data-map-asset-kit"),
    factionSurfaceCount: readNumberAttribute(
      mapViewport,
      "data-map-faction-surface-count",
    ),
    frontCount: readNumberAttribute(mapViewport, "data-map-front-count"),
    worldContentOccupancy: {
      width: readNumberAttribute(
        mapViewport,
        "data-world-content-occupancy-width",
      ),
      height: readNumberAttribute(
        mapViewport,
        "data-world-content-occupancy-height",
      ),
    },
    mobileContentOccupancy: {
      width: readNumberAttribute(
        mapViewport,
        "data-mobile-content-occupancy-width",
      ),
      height: readNumberAttribute(
        mapViewport,
        "data-mobile-content-occupancy-height",
      ),
    },
  });

  const documentOverflow = () => {
    const root = document.documentElement;
    const body = document.body;
    const clientWidth = root?.clientWidth || window.innerWidth || 0;
    const clientHeight = root?.clientHeight || window.innerHeight || 0;
    const scrollWidth = Math.max(
      clientWidth,
      root?.scrollWidth || 0,
      body?.scrollWidth || 0,
    );
    const scrollHeight = Math.max(
      clientHeight,
      root?.scrollHeight || 0,
      body?.scrollHeight || 0,
    );
    return {
      clientWidth: round(clientWidth),
      clientHeight: round(clientHeight),
      scrollWidth: round(scrollWidth),
      scrollHeight: round(scrollHeight),
      horizontalOverflowPx: round(Math.max(0, scrollWidth - clientWidth)),
      verticalOverflowPx: round(Math.max(0, scrollHeight - clientHeight)),
    };
  };

  const flowComponents = (canvasRect) => {
    const definitions = [
      ["header", [".game-header", "header"]],
      ["metricStrip", [".metric-strip"]],
      ["timeControls", [".time-controls", '[aria-label="시간 진행"]']],
      ["mapHeading", [".map-surface-heading"]],
    ];
    const components = definitions.map(([name, selectors]) => {
      const element = firstElement(selectors, { visibleOnly: true });
      return {
        name,
        selectors,
        rect: rectFromElement(element),
        overlapsCanvas: Boolean(rectanglesOverlap(rectFromElement(element), canvasRect)),
      };
    });
    const viewport = viewportRect();
    return {
      canvasTopY: canvasRect ? round(canvasRect.top - viewport.top) : null,
      cumulativeOccupiedHeightPx: canvasRect
        ? round(Math.max(0, canvasRect.top - viewport.top))
        : null,
      components,
      method:
        "canvas viewport top minus visual viewport top; component rects are diagnostic and must not be summed because containers overlap.",
    };
  };

  const drawerRects = (canvasRect) => {
    const selectors = [
      ".contextual-drawer",
      "[data-contextual-drawer]",
      '[aria-label="상황 패널"]',
    ];
    const elements = findVisibleElements(selectors);
    const rawRects = elements.map(rectFromElement).filter(Boolean);
    const clippedRects = rawRects.map((rect) => clipRect(rect, canvasRect)).filter(Boolean);
    const canvasArea = canvasRect?.area || 0;
    const obstructionArea = unionArea(clippedRects);
    return {
      selectors,
      visibleDrawerCount: elements.length,
      drawers: elements.slice(0, MAX_PROBE_ELEMENTS).map(elementSummary),
      obstructionAreaPx: obstructionArea,
      obstructionRatioOfCanvas: canvasArea
        ? round(obstructionArea / canvasArea)
        : null,
      method: "union of visible drawer rects intersected with canvas viewport rect.",
      note: "A drawer over the canvas is obstruction even when the underlying WebGL pixels remain rendered.",
      clippedRects,
    };
  };

  const normaliseLocalRect = (input, canvasRect) => {
    if (!input || !canvasRect) {
      throw new Error("A canvas-local rectangle and a visible map canvas are required.");
    }
    const source = input.rect || input;
    const isNormalised = Boolean(input.normalized || source.normalized);
    const rawLeft = positiveNumber(source.x ?? source.left);
    const rawTop = positiveNumber(source.y ?? source.top);
    const rawWidth = positiveNumber(
      source.width ??
        (source.right !== undefined && source.left !== undefined
          ? Number(source.right) - Number(source.left)
          : null),
    );
    const rawHeight = positiveNumber(
      source.height ??
        (source.bottom !== undefined && source.top !== undefined
          ? Number(source.bottom) - Number(source.top)
          : null),
    );
    if (![rawLeft, rawTop, rawWidth, rawHeight].every((value) => value !== null)) {
      throw new Error("Use { x, y, width, height } in canvas CSS pixels.");
    }
    const scaleX = isNormalised ? canvasRect.width : 1;
    const scaleY = isNormalised ? canvasRect.height : 1;
    const left = Math.max(0, Math.min(canvasRect.width, rawLeft * scaleX));
    const top = Math.max(0, Math.min(canvasRect.height, rawTop * scaleY));
    const right = Math.max(left, Math.min(canvasRect.width, (rawLeft + rawWidth) * scaleX));
    const bottom = Math.max(top, Math.min(canvasRect.height, (rawTop + rawHeight) * scaleY));
    const result = rectFromValues(left, top, right - left, bottom - top);
    if (!result) throw new Error("Annotation rectangle must have positive area.");
    return {
      x: result.left,
      y: result.top,
      width: result.width,
      height: result.height,
    };
  };

  const annotationMetric = (kind, canvasRect, drawerMeasurement) => {
    const annotation = state.annotations[kind];
    const base = {
      kind,
      definition:
        kind === "terrain"
          ? "visible terrain polygon/ground footprint; exclude stage backdrop and UI chrome."
          : "smallest enclosing rectangle of player-readable capital, major POI, settlement, route, project, territory, and conflict content; exclude labels-only text and UI chrome.",
      source: "manual-canvas-annotation",
      method: "smallest-enclosing-rectangle in canvas-local CSS pixels",
    };
    if (!annotation) {
      return {
        ...base,
        status: "NOT_MEASURED",
        reason: "Run select(kind) or annotate(kind, {x,y,width,height}) for this capture.",
        bounds: null,
      };
    }
    if (!canvasRect) {
      return {
        ...base,
        status: "NOT_MEASURED",
        reason: "The annotated canvas is no longer visible.",
        bounds: null,
      };
    }
    const currentSignature = sceneSignature(findMapViewport());
    const staleReasons = [];
    if (state.capture && annotation.captureId !== state.capture.id) {
      staleReasons.push("capture-id-changed; call beginCapture for every screenshot state");
    }
    if (annotation.sceneSignature !== currentSignature) {
      staleReasons.push("scene signature changed; re-annotate after tick/camera/label changes");
    }
    if (
      Math.abs(annotation.canvasSize.width - canvasRect.width) > 1 ||
      Math.abs(annotation.canvasSize.height - canvasRect.height) > 1
    ) {
      staleReasons.push("canvas dimensions changed");
    }
    if (staleReasons.length > 0) {
      return {
        ...base,
        status: "STALE_ANNOTATION",
        reason: staleReasons.join("; "),
        bounds: null,
        capturedLocalRect: annotation.localRect,
      };
    }
    const local = annotation.localRect;
    const screen = rectFromValues(
      canvasRect.left + local.x,
      canvasRect.top + local.y,
      local.width,
      local.height,
    );
    const clippedToCanvas = clipRect(screen, canvasRect);
    const clippedToViewport = clipRect(screen, viewportRect());
    const drawerClips = (drawerMeasurement?.clippedRects || [])
      .map((rect) => clipRect(rect, clippedToViewport))
      .filter(Boolean);
    const occludedArea = unionArea(drawerClips);
    const visibleAreaInCanvas = Math.max(
      0,
      (clippedToCanvas?.area || 0) -
        unionArea(
          (drawerMeasurement?.clippedRects || [])
            .map((rect) => clipRect(rect, clippedToCanvas))
            .filter(Boolean),
        ),
    );
    return {
      ...base,
      status: "MEASURED",
      capturedAt: annotation.capturedAt,
      captureId: annotation.captureId,
      bounds: {
        localToCanvas: local,
        screen,
        clippedToCanvas,
        clippedToViewport,
      },
      widthRatioOfCanvas: clippedToCanvas
        ? round(clippedToCanvas.width / canvasRect.width)
        : 0,
      heightRatioOfCanvas: clippedToCanvas
        ? round(clippedToCanvas.height / canvasRect.height)
        : 0,
      areaRatioOfCanvas: clippedToCanvas
        ? round(clippedToCanvas.area / canvasRect.area)
        : 0,
      visibleAreaInCanvasPx: round(visibleAreaInCanvas),
      visibleAreaRatioOfCanvas: canvasRect.area
        ? round(visibleAreaInCanvas / canvasRect.area)
        : 0,
      firstViewportVisibleAreaPx: round(
        Math.max(0, (clippedToViewport?.area || 0) - occludedArea),
      ),
      firstViewportActualWorldShare: viewportRect()?.area
        ? round(
            Math.max(0, (clippedToViewport?.area || 0) - occludedArea) /
              viewportRect().area,
          )
        : null,
      drawerOccludedAreaPx: round(occludedArea),
    };
  };

  const screenCountMetric = (key, domProbe, metadataValue) => {
    const manual = state.screenCounts[key];
    return {
      value: manual?.value ?? null,
      status: manual ? "MEASURED_FROM_SCREENSHOT" : "NOT_MEASURED",
      source: manual?.source || null,
      evidencePath: manual?.evidencePath || null,
      note: manual?.note || null,
      domProbe: domProbe
        ? {
            value: domProbe.visibleInCanvasCount,
            source: "DOM visible-element probe; not a Canvas/WebGL screen count",
          }
        : null,
      metadata: {
        value: metadataValue ?? null,
        source: "metadata-not-screen-proof",
      },
    };
  };

  const targetMeasurement = (element, role) => {
    const rect = rectFromElement(element);
    return {
      role,
      label: labelFor(element),
      rect,
      minimumDimensionPx: rect ? round(Math.min(rect.width, rect.height)) : null,
      meets44pxFloor: rect ? Math.min(rect.width, rect.height) >= 44 : null,
    };
  };

  const hitTargetProbe = (selectors, role) => {
    const elements = findVisibleElements(selectors).filter(
      (element) => element.tagName.toLowerCase() === "button" || element.matches("[role=button]"),
    );
    const measurements = elements.map((element) => targetMeasurement(element, role));
    const smallest = measurements.reduce(
      (current, candidate) =>
        !current ||
        (candidate.minimumDimensionPx ?? Number.POSITIVE_INFINITY) <
          (current.minimumDimensionPx ?? Number.POSITIVE_INFINITY)
          ? candidate
          : current,
      null,
    );
    return {
      selectors,
      status: smallest ? "MEASURED" : "NOT_MEASURED",
      smallest,
      allVisibleTargets: measurements,
      floorPx: 44,
      note: "44px is the fixed QA floor. A selector miss is NOT_MEASURED, not PASS.",
    };
  };

  const findMeasures = () => {
    const mapViewport = findMapViewport();
    const canvasElement = findCanvas();
    const stage = findStage();
    const canvasRect = rectFromElement(mapViewport) || rectFromElement(canvasElement);
    const stageRect = rectFromElement(stage);
    const viewport = viewportRect();
    const drawers = drawerRects(canvasRect);
    const metadata = runtimeMetadata(mapViewport);
    const terrain = annotationMetric("terrain", canvasRect, drawers);
    const meaningful = annotationMetric("meaningful", canvasRect, drawers);

    const labelDomProbe = probeElements(
      [
        "[data-map-label]",
        ".map-label",
        ".atlas-label",
        ".world-label",
      ],
      canvasRect,
    );
    const poiDomProbe = probeElements(
      [
        "[data-map-poi]",
        "[data-poi-kind]",
        ".atlas-poi-marker",
        "[data-map-object-kind='poi']",
      ],
      canvasRect,
    );
    const factionDomProbe = probeElements(
      [
        "[data-map-faction-surface]",
        ".faction-territory-surface",
        "[data-faction-surface]",
      ],
      canvasRect,
    );
    const frontDomProbe = probeElements(
      ["[data-map-front]", ".map-front", "[data-map-boundary-kind='front']"],
      canvasRect,
    );
    const routeDomProbe = probeElements(
      ["[data-map-route]", ".map-route", "[data-map-object-kind='route']"],
      canvasRect,
    );
    const screenInventory = {
      labelCount: screenCountMetric(
        "labelCount",
        labelDomProbe,
        metadata.labelCount,
      ),
      visiblePoiCount: screenCountMetric(
        "visiblePoiCount",
        poiDomProbe,
        null,
      ),
      factionSurfaceCount: screenCountMetric(
        "factionSurfaceCount",
        factionDomProbe,
        metadata.factionSurfaceCount,
      ),
      frontCount: screenCountMetric(
        "frontCount",
        frontDomProbe,
        metadata.frontCount,
      ),
      routeCount: screenCountMetric("routeCount", routeDomProbe, null),
    };
    const flow = flowComponents(canvasRect);
    const overflow = documentOverflow();
    const mapControls = hitTargetProbe(
      [
        ".map-camera-controls button",
        "[data-map-zoom]",
        "[data-map-focus]",
      ],
      "map-control",
    );
    const primaryActions = hitTargetProbe(
      [
        "[data-qa-primary-action]",
        "button.primary-action",
        "button.play-button",
        ".time-controls .play-button",
        "button[aria-label*='재생']",
        "button[aria-label*='진행']",
        ".decision-card button",
        ".intervention-action",
      ],
      "primary-action",
    );

    const occupancy = {
      STAGE_OCCUPANCY: {
        status: stageRect && viewport ? "MEASURED" : "NOT_MEASURED",
        source: "DOM stage/container rect",
        definition: "container/stage area; never a proxy for world content",
        bounds: stageRect,
        widthRatioOfViewport: stageRect && viewport
          ? round((clipRect(stageRect, viewport)?.width || 0) / viewport.width)
          : null,
        heightRatioOfViewport: stageRect && viewport
          ? round((clipRect(stageRect, viewport)?.height || 0) / viewport.height)
          : null,
        areaRatioOfViewport: stageRect && viewport
          ? round((clipRect(stageRect, viewport)?.area || 0) / viewport.area)
          : null,
      },
      TERRAIN_OCCUPANCY: terrain,
      MEANINGFUL_WORLD_OCCUPANCY: meaningful,
    };

    const meaningfulViewportShare =
      meaningful.status === "MEASURED"
        ? meaningful.firstViewportActualWorldShare
        : null;

    return {
      helper: {
        name: "TMR Integration Visual QA helper",
        version: VERSION,
        generatedAt: new Date().toISOString(),
        url: window.location.href,
        scrollX: round(window.scrollX),
        scrollY: round(window.scrollY),
        instruction: "Run at scroll top; beginCapture and re-annotate for every matrix state.",
      },
      capture: state.capture,
      viewport: {
        width: round(window.innerWidth),
        height: round(window.innerHeight),
        devicePixelRatio: round(window.devicePixelRatio || 1),
        visualViewport: window.visualViewport
          ? {
              width: round(window.visualViewport.width),
              height: round(window.visualViewport.height),
              offsetTop: round(window.visualViewport.offsetTop),
              offsetLeft: round(window.visualViewport.offsetLeft),
            }
          : null,
      },
      canvasViewportRect: canvasRect,
      canvasElementRect: rectFromElement(canvasElement),
      stageRect,
      projectedMeaningfulWorldBounds:
        meaningful.status === "MEASURED" ? meaningful.bounds : null,
      occupancy,
      desktop: {
        appliesWhen: "viewport 1440x900",
        canvasViewportRect: canvasRect,
        projectedMeaningfulWorldBounds:
          meaningful.status === "MEASURED" ? meaningful.bounds : null,
        actualMeaningfulWorldWidthRatio:
          meaningful.status === "MEASURED" ? meaningful.widthRatioOfCanvas : null,
        actualMeaningfulWorldHeightRatio:
          meaningful.status === "MEASURED" ? meaningful.heightRatioOfCanvas : null,
        hudHeaderOccupiedHeightPx: flow.cumulativeOccupiedHeightPx,
        documentVerticalOverflowPx: overflow.verticalOverflowPx,
        horizontalOverflowPx: overflow.horizontalOverflowPx,
        labelCount: screenInventory.labelCount,
        visiblePoiCount: screenInventory.visiblePoiCount,
        factionSurfaceCount: screenInventory.factionSurfaceCount,
        frontCount: screenInventory.frontCount,
      },
      mobile: {
        appliesWhen: "viewport 390x844",
        canvasTopY: flow.canvasTopY,
        canvasHeightPx: canvasRect?.height ?? null,
        canvasHeightViewportRatio: canvasRect && viewport
          ? round(canvasRect.height / viewport.height)
          : null,
        firstViewportCanvasVisibleHeightRatio: canvasRect && viewport
          ? round((clipRect(canvasRect, viewport)?.height || 0) / viewport.height)
          : null,
        firstViewportActualWorldShare: meaningfulViewportShare,
        firstViewportActualWorldShareDefinition:
          "visible meaningful-world area after drawer occlusion divided by visual viewport area",
        hudHeaderTimeControlsCumulativeHeightPx:
          flow.cumulativeOccupiedHeightPx,
        smallestMapControlHitTarget: mapControls.smallest,
        smallestPrimaryActionHitTarget: primaryActions.smallest,
        horizontalOverflowPx: overflow.horizontalOverflowPx,
        drawerObstructionRatio: drawers.obstructionRatioOfCanvas,
      },
      flow,
      overflow,
      screenInventory,
      touchTargets: {
        mapControls,
        primaryActions,
      },
      drawer: drawers,
      domProbes: {
        labels: labelDomProbe,
        poi: poiDomProbe,
        factionSurfaces: factionDomProbe,
        fronts: frontDomProbe,
        routes: routeDomProbe,
      },
      runtimeMetadata: metadata,
      annotations: state.annotations,
      warnings: [
        ...(canvasRect ? [] : ["No visible map canvas/viewport was found."]),
        ...(terrain.status === "MEASURED" ? [] : [`TERRAIN_OCCUPANCY ${terrain.status}.`]),
        ...(meaningful.status === "MEASURED"
          ? []
          : [`MEANINGFUL_WORLD_OCCUPANCY ${meaningful.status}.`]),
        ...COUNT_KEYS.filter((key) => !state.screenCounts[key]).map(
          (key) => `${key} requires a screenshot-blind setVisualCounts() entry.`,
        ),
        ...(overflow.horizontalOverflowPx > 0
          ? [`Horizontal overflow ${overflow.horizontalOverflowPx}px.`]
          : []),
      ],
    };
  };

  const measure = () => findMeasures();

  const cleanupOverlay = (overlay) => {
    if (!overlay) return;
    overlay.remove();
    state.overlays.delete(overlay);
  };

  const select = (kind) => {
    if (kind !== "terrain" && kind !== "meaningful") {
      return Promise.reject(new Error("kind must be 'terrain' or 'meaningful'."));
    }
    const mapViewport = findMapViewport();
    const canvasRect = rectFromElement(mapViewport) || rectFromElement(findCanvas());
    if (!canvasRect) {
      return Promise.reject(new Error("No visible map canvas/viewport was found."));
    }
    const overlay = document.createElement("div");
    overlay.dataset.tmrVisualQaOverlay = kind;
    Object.assign(overlay.style, {
      position: "fixed",
      zIndex: "2147483647",
      left: `${canvasRect.left}px`,
      top: `${canvasRect.top}px`,
      width: `${canvasRect.width}px`,
      height: `${canvasRect.height}px`,
      cursor: "crosshair",
      touchAction: "none",
      background: "rgb(0 0 0 / 8%)",
      outline: "2px dashed #ffd166",
    });
    const instruction = document.createElement("div");
    instruction.textContent = `${kind}: 드래그해 bounding box를 지정하고, 취소는 Esc`;
    Object.assign(instruction.style, {
      position: "absolute",
      left: "8px",
      top: "8px",
      padding: "6px 8px",
      color: "#fff",
      background: "rgb(0 0 0 / 78%)",
      font: "12px/1.2 sans-serif",
      pointerEvents: "none",
    });
    const box = document.createElement("div");
    Object.assign(box.style, {
      position: "absolute",
      display: "none",
      border: "2px solid #ff6b6b",
      background: "rgb(255 107 107 / 18%)",
      pointerEvents: "none",
    });
    overlay.append(instruction, box);
    document.body.appendChild(overlay);
    state.overlays.add(overlay);

    return new Promise((resolve) => {
      let start = null;
      let settled = false;
      const localPoint = (event) => ({
        x: Math.max(0, Math.min(canvasRect.width, event.clientX - canvasRect.left)),
        y: Math.max(0, Math.min(canvasRect.height, event.clientY - canvasRect.top)),
      });
      const finish = (result) => {
        if (settled) return;
        settled = true;
        document.removeEventListener("keydown", onKeyDown, true);
        cleanupOverlay(overlay);
        resolve(result);
      };
      const onKeyDown = (event) => {
        if (event.key === "Escape") finish(measure());
      };
      overlay.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        start = localPoint(event);
        overlay.setPointerCapture?.(event.pointerId);
        box.style.display = "block";
      });
      overlay.addEventListener("pointermove", (event) => {
        if (!start) return;
        event.preventDefault();
        const point = localPoint(event);
        const left = Math.min(start.x, point.x);
        const top = Math.min(start.y, point.y);
        Object.assign(box.style, {
          left: `${left}px`,
          top: `${top}px`,
          width: `${Math.abs(point.x - start.x)}px`,
          height: `${Math.abs(point.y - start.y)}px`,
        });
      });
      overlay.addEventListener("pointerup", (event) => {
        if (!start) return;
        event.preventDefault();
        const point = localPoint(event);
        const localRect = {
          x: Math.min(start.x, point.x),
          y: Math.min(start.y, point.y),
          width: Math.abs(point.x - start.x),
          height: Math.abs(point.y - start.y),
        };
        if (localRect.width < 2 || localRect.height < 2) {
          console.warn(`[${ROOT_KEY}] selection is too small; try again.`);
          start = null;
          box.style.display = "none";
          return;
        }
        try {
          annotate(kind, localRect);
          finish(measure());
        } catch (error) {
          console.error(`[${ROOT_KEY}] annotation failed`, error);
          finish(measure());
        }
      });
      document.addEventListener("keydown", onKeyDown, true);
      console.info(`[${ROOT_KEY}] select('${kind}'): drag on the map canvas.`);
    });
  };

  const beginCapture = (id, options = {}) => {
    state.capture = {
      id: String(id || `capture-${Date.now()}`),
      notes: options.notes || null,
      screenshotPath: options.screenshotPath || null,
      startedAt: new Date().toISOString(),
      sceneSignature: sceneSignature(findMapViewport()),
    };
    state.annotations.terrain = null;
    state.annotations.meaningful = null;
    for (const key of COUNT_KEYS) state.screenCounts[key] = null;
    return measure();
  };

  const annotate = (kind, input) => {
    if (kind !== "terrain" && kind !== "meaningful") {
      throw new Error("kind must be 'terrain' or 'meaningful'.");
    }
    const mapViewport = findMapViewport();
    const canvasRect = rectFromElement(mapViewport) || rectFromElement(findCanvas());
    const localRect = normaliseLocalRect(input, canvasRect);
    state.annotations[kind] = {
      localRect,
      canvasSize: { width: canvasRect.width, height: canvasRect.height },
      captureId: state.capture?.id || null,
      sceneSignature: sceneSignature(mapViewport),
      capturedAt: new Date().toISOString(),
    };
    return measure();
  };

  const clear = (kind) => {
    if (kind) {
      if (!(kind in state.annotations)) throw new Error(`Unknown annotation: ${kind}`);
      state.annotations[kind] = null;
    } else {
      state.annotations.terrain = null;
      state.annotations.meaningful = null;
    }
    return measure();
  };

  const setVisualCounts = (values, options = {}) => {
    for (const key of COUNT_KEYS) {
      if (values[key] === undefined || values[key] === null) continue;
      state.screenCounts[key] = {
        value: nonNegativeInteger(values[key], key),
        source: "manual-screenshot-blind-count",
        evidencePath: options.evidencePath || state.capture?.screenshotPath || null,
        note: options.note || null,
        capturedAt: new Date().toISOString(),
        captureId: state.capture?.id || null,
      };
    }
    return measure();
  };

  const markPrimaryAction = (element) => {
    if (!element || typeof element.setAttribute !== "function") {
      throw new Error("Pass a button or [role=button] element.");
    }
    const previousValue = element.getAttribute("data-qa-primary-action");
    element.setAttribute("data-qa-primary-action", "marked");
    state.markedPrimaryActions.push({ element, previousValue });
    return measure();
  };

  const copyJson = async () => {
    const json = JSON.stringify(measure(), null, 2);
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(json);
    return json;
  };

  const destroy = () => {
    for (const overlay of [...state.overlays]) cleanupOverlay(overlay);
    for (const marked of state.markedPrimaryActions) {
      if (!marked.element?.isConnected) continue;
      if (marked.previousValue === null) {
        marked.element.removeAttribute("data-qa-primary-action");
      } else {
        marked.element.setAttribute("data-qa-primary-action", marked.previousValue);
      }
    }
    if (globalThis[ROOT_KEY] === api) delete globalThis[ROOT_KEY];
  };

  const api = {
    version: VERSION,
    measure,
    beginCapture,
    select,
    annotate,
    clear,
    setVisualCounts,
    markPrimaryAction,
    copyJson,
    destroy,
  };

  globalThis[ROOT_KEY] = api;
  console.info(
    `[${ROOT_KEY}] v${VERSION} ready. ` +
      "Use beginCapture(id), select('terrain'), select('meaningful'), " +
      "setVisualCounts({...}), and measure().",
  );
  console.info(
    `[${ROOT_KEY}] STAGE_OCCUPANCY is DOM-only; ` +
      "TERRAIN/MEANINGFUL require canvas annotations.",
  );
  return api;
})();
