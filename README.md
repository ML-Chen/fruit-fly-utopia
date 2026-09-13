# Hedonium

A male *Drosophila melanogaster* given only things it wants.

The point cloud is a stratified sample of real soma positions from the
[MaleCNS v1.0 connectome](https://blog.google/innovation-and-ai/technology/research/male-fruit-fly-brain-map/)
(HHMI Janelia FlyEM, Google Research, Cambridge, MRC LMB; Cell 2026) —
166,691 neurons, ~125 million synapses, CC-BY.

The fly in the dish is a geometric model. Its motion is not decoration: it is
the motor program that the corresponding circuit would emit.

## Hedonic index

Flies almost certainly lack a mammalian opioid “liking” system. What they have
is a layered reinforcement circuit:

**Gr5a sugar GRNs → OA-VUM octopamine → PAM dopamine neurons → Kenyon cells / MBONs → MN9 (proboscis extension)**

The number in the corner is that circuit’s operational readout:

`0.30·PAM + 0.16·OA + 0.14·sugar + 0.12·NPF + 0.16·MN9 + 0.12·MBON − 0.32·PPL1`

It is not a feeling. Sugar saturates near **64**. Hedonium clamps the same
channels to the ceiling. Cocaine floods dopamine and the fly walks in circles —
MN9 stays quiet, so it never drinks. Wanting is not tasting.

## Why it moves

| World | Motor program | Cause |
| --- | --- | --- |
| Empty arena | Grooming, short walks | Default VNC / central-complex programs |
| Sugar water | Approach, then PER | Sweet GRNs fire MN9; PAM writes reward |
| Ethanol | Disinhibited walking | Flies seek fermenting fruit; OA / NPF rise |
| Cocaine | Hypermotor circling | dDAT block → lingering DA onto descending neurons |
| Doomscroll | Fixate, then skip | Kenyon-cell novelty habituates → locomotor skip |
| Hedonium | Locked PER | Appetitive arm clamped; aversive PPL1 silenced |

There is no quinine, shock, or other aversive protocol.

The dynamics are a reduced rate model, not a leaky-integrate-and-fire pass over
125 million synapses. Soma positions are real. Treat the numbers as an
instrument, not a mind.

## Run

```bash
npm install
npm run dev
```

Opens on port 8080. `public/data/somata.bin` is a compact 16-byte-per-soma
sample of MaleCNS body annotations.

## References

- Shiu, Sterne, et al. (2024). A leaky integrate-and-fire connectome model of the adult *Drosophila* brain. *bioRxiv* / *Nature*.
- Burke, Huetteroth, et al. (2012). Layered reward signalling through octopamine and dopamine in *Drosophila*. *Nature*.
- McClung & Hirsh (1998). Stereotypic behavioral responses to free-base cocaine in *Drosophila*.
- MaleCNS v1.0, FlyEM / Google Research (2026).
