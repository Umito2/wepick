# WePick website photography

Downloaded and verified on 2026-10-31. All four source pages explicitly identify the photos as free under the standard [Unsplash License](https://unsplash.com/license), rather than Unsplash+. The license permits free commercial website use; attribution is appreciated. These files illustrate WePick's decision categories and do not imply photographer endorsement.

The images are served locally from `docs/images/`. Each is a JPEG requested from Unsplash's image CDN at `w=1000&q=80&fit=crop&fm=jpg`, with no further local image editing. Every asset is below 300 KB. All four downloaded images were visually inspected.

| Local asset | Photographer | Verified source page | Dimensions | Size | Suggested alt text |
| --- | --- | --- | --- | --- | --- |
| `docs/images/coffee.jpg` | Tim Mossholder | [Two cups of coffee](https://unsplash.com/photos/two-cups-of-coffee-sit-on-a-table-mgvCv7Ht5hw) | 1000 × 1500 | 181,923 bytes | Two white coffee mugs on a cafe table. |
| `docs/images/pizza.jpg` | Nik Owens | [Wood-fired pizza](https://unsplash.com/photos/pizza-on-brown-wooden-table-40OJLYVWeeM) | 1000 × 668 | 98,680 bytes | Fresh pizza on a wooden board beside a glowing oven. |
| `docs/images/movie-night.jpg` | Georgia Vagim | [Night at the movies](https://unsplash.com/photos/popcorns-on-clear-glass-bowl-ny-lHmsHYHk) | 1000 × 665 | 86,054 bytes | A glass bowl of popcorn ready for movie night. |
| `docs/images/picnic.jpg` | Julia Ivanina | [Picnic on the grass](https://unsplash.com/photos/a-picnic-blanket-on-the-grass-with-a-tea-pot-book-strawberries-EXuqL_hiF2Q) | 1000 × 1500 | 269,321 bytes | Coffee, strawberries and a book on a picnic blanket. |

## Exact downloaded image URLs

- Coffee: <https://images.unsplash.com/photo-1635317735762-6a5ae18ee1c9?w=1000&q=80&fit=crop&fm=jpg>
- Pizza: <https://images.unsplash.com/photo-1579751626657-72bc17010498?w=1000&q=80&fit=crop&fm=jpg>
- Movie night: <https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=1000&q=80&fit=crop&fm=jpg>
- Picnic: <https://images.unsplash.com/photo-1654596712256-20867899fb9b?w=1000&q=80&fit=crop&fm=jpg>

The CDN photo identifiers were obtained from the actual image links on the verified source pages. No guessed photo identifiers or paid Unsplash+ assets are included.

## Placement notes

Coffee and picnic are portrait images suitable for the interactive deck. Pizza and popcorn are landscape images suitable for category panels; CSS `object-fit: cover` can adapt them to card frames. For the picnic image, an `object-position` near `50% 70%` keeps the blanket and food visible in a short landscape crop. For pizza, a position near `50% 65%` emphasizes the pizza.

Suggested visible credit: “Photography by Tim Mossholder, Nik Owens, Georgia Vagim and Julia Ivanina on Unsplash,” with names linked to the source pages above.
