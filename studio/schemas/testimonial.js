import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'location', title: 'Location', type: 'string'}),
    defineField({name: 'context', title: 'Context', type: 'string', description: 'e.g. Wedding guest, Received in 2 days'}),
    defineField({name: 'text', title: 'Quote', type: 'text', validation: (r) => r.required()}),
    defineField({name: 'rating', title: 'Rating', type: 'number', validation: (r) => r.min(1).max(5), initialValue: 5}),
  ],
  preview: {
    select: {title: 'name', subtitle: 'location'},
  },
})
