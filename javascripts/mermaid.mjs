import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';

mermaid.registerIconPacks([
    {
        name: 'mids',
        loader: () =>
            fetch('https://unpkg.com/@iconify-json/mdi@1/icons.json').then((res) => res.json()),
    },
]);

window.mermaid = mermaid;
