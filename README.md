# Fruit fly utopia

A male *Drosophila melanogaster* given only things it wants.

The point cloud is a stratified sample of real soma positions from the
[MaleCNS v1.0 connectome](https://blog.google/innovation-and-ai/technology/research/male-fruit-fly-brain-map/)
(HHMI Janelia FlyEM, Google Research, Cambridge, MRC LMB; Cell 2026) —
166,691 neurons, ~125 million synapses, CC-BY.

The fly in the dish is a geometric model. Its motion is the motor program the
corresponding circuit would emit.

This is not hedonium and it is not a feeling. Flies have **wanting** and
**reinforcement**. They almost certainly do not have a mammalian liking system.

## What is being maximised

**Welfare** is a human-chosen objective, printed as such:

`0.40·PER + 0.20·sugar + 0.16·PAM_nutrient + 0.10·OA·(1−agit) + 0.12·(1−PPL1) + 0.06·NPF·(1−agit) − 0.22·agitation − 0.10·DA_flood`

That is: ongoing consumption and postingestive nutrient, minus punishment and
hyperdopaminergic agitation. Cocaine loses. Sugar is a meal. Utopia is that
meal without end, with PPL1 off and walking calm.

It is **not** “max PAM.” Activating the whole reward-PAM cluster can make a fly
acutely averse even while those cells write a positive memory.

## Circuit (the parts that are real)

| Path | What it is | Source |
| --- | --- | --- |
| Gr5a → TH-VUM → MN9 | Innate PER / palatability. Parallel to learning, not downstream of it. | Marella et al. 2012 |
| sweet → OA → PAM taste-DANs | Short-term reinforcement of sweet | Burke et al. 2012 |
| nutrition → PAM γ5 / α1 | Slower postingestive reward, OA-independent | Huetteroth, Yamagata 2015 |
| PAM vs PPL1 on MBONs | Valence ≈ approach − avoidance | Aso 2014; Bennett 2021 |
| Sugar ⊣ PPL1 | Reward also quiets punishment DANs | Cohn et al. 2015 |
| dDAT block | Extrasynaptic DA, hyperlocomotion, no PER | McClung & Hirsh 1998 |

The dynamics are a reduced rate model. Soma positions are real. The Hz numbers
are model-equivalent, not patch-clamp.

## Why it moves

| World | Motor program | Welfare |
| --- | --- | --- |
| Empty arena | Grooming, short walks | floor |
| Sugar water | Approach, then PER | high — a real meal |
| Ethanol | Disinhibited walking | mid — seeking, not drinking |
| Cocaine | Hypermotor circling | floor — wanting, no meal |
| Doomscroll | Fixate, then skip | low — novelty is not consumption |
| Utopia | Locked PER, calm | ceiling — meal that does not end |

There is no quinine, shock, or other aversive protocol.

## Run

```bash
npm install
npm run dev
```

`public/data/somata.bin` is a compact 16-byte-per-soma sample of MaleCNS body
annotations.

## References

- Marella, Mann, Scott (2012). Dopaminergic modulation of sucrose acceptance behavior in *Drosophila*. *Neuron*.
- Burke, Huetteroth, et al. (2012). Layered reward signalling through octopamine and dopamine in *Drosophila*. *Nature*.
- Huetteroth / Yamagata et al. (2015). Sweet taste vs nutritional value in PAM subsets.
- Aso et al. (2014). Mushroom body output neurons; valence map.
- Bennett et al. (2021). Approach − avoidance MBON difference as valence.
- Cohn, Morantte, Ruta (2015). Coordinated and compartmentalized dopamine.
- McClung & Hirsh (1998). Cocaine responses in *Drosophila*.
- MaleCNS v1.0, FlyEM / Google Research (2026).
