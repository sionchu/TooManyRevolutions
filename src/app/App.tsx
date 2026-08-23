import { FOUNDATION_SCENARIO } from "../sim/state/scenario";
import { createInitialWorldState } from "../sim/state/world";

const foundationState = createInitialWorldState(FOUNDATION_SCENARIO, 20260821);

export function App() {
  return (
    <main className="foundation-shell">
      <section className="foundation-card" aria-labelledby="app-title">
        <p className="eyebrow">Gate 0 · Foundation</p>
        <h1 id="app-title">Fantasy State Simulator</h1>
        <p className="lede">
          A browser-native systemic fantasy state simulation is taking shape.
        </p>
        <dl className="foundation-status">
          <div>
            <dt>Simulation</dt>
            <dd>Renderer-independent</dd>
          </div>
          <div>
            <dt>Seed</dt>
            <dd>{foundationState.rngState.seed}</dd>
          </div>
          <div>
            <dt>Tick</dt>
            <dd>{foundationState.tick}</dd>
          </div>
        </dl>
        <p className="scope-note">
          Foundation scaffold only. Gameplay systems begin at Gate 1.
        </p>
      </section>
    </main>
  );
}
