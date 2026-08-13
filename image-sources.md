# Izvori slika (card-images / quiz planet_questions)

Dokaz prava za sve slike u Supabase Storage bucketu `card-images`. Sve su NASA
(ili NASA-suvlasnicke) fotografije/mozaici, javno vlasnistvo ili CC BY 4.0 —
slobodno za komercijalnu upotrebu. Obradjene (centriran kvadratni kadar,
1100x1100, .webp) 2026-08-13, izvor: images.nasa.gov / science.nasa.gov.

| Fajl (deck/ime) | Originalni izvor | NASA ID | Kredit | Licenca |
|---|---|---|---|---|
| `inner-planets/mercury_full_disk.webp` | [images.nasa.gov](https://images.nasa.gov/details/PIA15160) | PIA15160 | NASA/Johns Hopkins University Applied Physics Laboratory/Carnegie Institution of Washington | Javno vlasnistvo (NASA image use policy) |
| `inner-planets/venus_full_disk.webp` | [images.nasa.gov](https://images.nasa.gov/details/PIA23791) | PIA23791 | NASA/JPL-Caltech, Mariner 10 podaci, obrada Kevin M. Gill | Javno vlasnistvo |
| `inner-planets/earth_blue_marble.webp` | [images.nasa.gov](https://images.nasa.gov/details/as17-148-22727) | as17-148-22727 | NASA (Apollo 17 posada, "Blue Marble") | Javno vlasnistvo |
| `inner-planets/mars_full_disk.webp` | [images.nasa.gov](https://images.nasa.gov/details/PIA00407) | PIA00407 | NASA/JPL/USGS | Javno vlasnistvo |
| `outer-planets/jupiter_full_disk.webp` | [images.nasa.gov](https://images.nasa.gov/details/PIA04866) | PIA04866 | NASA/JPL/Space Science Institute (Cassini) | Javno vlasnistvo |
| `outer-planets/saturn_rings.webp` | [images.nasa.gov](https://images.nasa.gov/details/PIA06193) | PIA06193 | NASA/JPL/Space Science Institute (Cassini) | Javno vlasnistvo |
| `outer-planets/uranus_full_disk.webp` | [images.nasa.gov](https://images.nasa.gov/details/PIA00032) | PIA00032 | NASA/JPL (Voyager 2) | Javno vlasnistvo |
| `outer-planets/neptune_full_disk.webp` | [images.nasa.gov](https://images.nasa.gov/details/PIA01492) | PIA01492 | NASA/JPL (Voyager 2) | Javno vlasnistvo |
| `stars/orion_nebula.webp` | [images.nasa.gov](https://images.nasa.gov/details/PIA01322) | PIA01322 | NASA/JPL-Caltech/STScI (Hubble) | Javno vlasnistvo |
| `stars/crab_nebula.webp` | [images.nasa.gov](https://images.nasa.gov/details/PIA03606) | PIA03606 | NASA/ESA/JPL/Arizona State Univ. (Hubble) | Javno vlasnistvo (NASA/ESA zajednicka -- standardni Hubble kredit) |
| `galaxies/milky_way_band.webp` | [images.nasa.gov](https://images.nasa.gov/details/iss044e045215) | iss044e045215 | NASA/JSC (ISS astronaut fotografija) | Javno vlasnistvo |
| `galaxies/spiral_galaxy.webp` | [images.nasa.gov](https://images.nasa.gov/details/PIA04230) | PIA04230 | NASA and The Hubble Heritage Team (STScI/AURA) | Javno vlasnistvo |
| `galaxies/andromeda_galaxy.webp` | [images.nasa.gov](https://images.nasa.gov/details/PIA25163) | PIA25163 | ESA/NASA/JPL-Caltech/GBT/WSRT/IRAM/C. Clark (STScI) | Mjesovita NASA/ESA kompozicija -- kredit svih institucija obavezan |
| `black-holes/black_hole_m87.webp` | [science.nasa.gov](https://science.nasa.gov/resource/first-image-of-a-black-hole/) | — (EHT) | Event Horizon Telescope Collaboration | CC BY 4.0 (komercijalna upotreba dozvoljena uz kredit) |
| `cosmology/cmb_map.webp` | [science.nasa.gov / WMAP](https://map.gsfc.nasa.gov/) | ilc_9yr_moll4096 | NASA/WMAP Science Team | Javno vlasnistvo |

## Napomene

- Sve slike centrirano kvadratno kadrirane i smanjene na 1100x1100 (originali
  su vecinom sireg formata) -- kadriranje/kompresija su moja obrada, izvorni
  sadrzaj i kredit ostaju kao gore.
- `crab_nebula` i `andromeda_galaxy` imaju eksplicitan ESA sukredit (Hubble
  odnosno Herschel/Planck) -- ako ces raditi store listing sa detaljnim
  attribution stranicom, navedi puni kredit iz ove tabele, ne samo "NASA".
- `black_hole_m87` NIJE NASA slika po porijeklu (EHT Collaboration), ali je
  CC BY 4.0 -- kredit "Event Horizon Telescope Collaboration" mora ostati
  vidljiv negdje u appu (npr. Settings > O aplikaciji / credits ekran, ako
  ga budes pravio).
