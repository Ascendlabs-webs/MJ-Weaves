import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({
      name: 'code',
      title: 'Code',
      type: 'string',
      description: 'Stable ref matching the old id, e.g. p01. Used in WhatsApp messages — do not change after publishing.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: {hotspot: true},
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'shade',
      title: 'Shade',
      type: 'string',
      description: 'e.g. Teal, Pink, Purple, Blue, Green, Gold, Maroon, Black',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'shadeHex',
      title: 'Shade colour',
      type: 'string',
      description: 'Hex colour for the filter dot, e.g. #116A5C',
    }),
    defineField({
      name: 'price',
      title: 'Price (₹)',
      type: 'number',
      validation: (r) => r.required().min(0),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Shown in the quick-view modal.',
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'In stock', value: 'in-stock'},
          {title: 'Held', value: 'held'},
          {title: 'Sold out', value: 'sold-out'},
        ],
        layout: 'radio',
      },
      initialValue: 'in-stock',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery',
      type: 'array',
      of: [{type: 'image', options: {hotspot: true}}],
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      description: 'Featured products sort first on the site.',
      initialValue: false,
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        defineField({name: 'title', title: 'SEO title', type: 'string'}),
        defineField({name: 'description', title: 'SEO description', type: 'text'}),
      ],
    }),
  ],
  preview: {
    select: {title: 'name', subtitle: 'code', media: 'photo'},
    prepare: (s) => ({title: s.title ? `${s.title} (${s.subtitle || '?'})` : 'Untitled', media: s.media}),
  },
})
