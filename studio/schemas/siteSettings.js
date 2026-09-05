import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  description: 'Singleton — exactly one of these should exist.',
  fields: [
    defineField({name: 'whatsappNumber', title: 'WhatsApp number', type: 'string', description: 'Country code, no + or spaces, e.g. 919876543210'}),
    defineField({name: 'instagramUrl', title: 'Instagram URL', type: 'url'}),
    defineField({name: 'heroEyebrow', title: 'Hero eyebrow', type: 'string'}),
    defineField({name: 'heroTitle', title: 'Hero title', type: 'string'}),
    defineField({name: 'heroLede', title: 'Hero lede', type: 'text'}),
    defineField({name: 'shippingPoints', title: 'Shipping points', type: 'array', of: [{type: 'string'}]}),
    defineField({name: 'carePoints', title: 'Care points', type: 'array', of: [{type: 'string'}]}),
  ],
  preview: {
    prepare: () => ({title: 'Site settings'}),
  },
})
