import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'faq',
  title: 'FAQ',
  type: 'document',
  fields: [
    defineField({name: 'question', title: 'Question', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'answer', title: 'Answer', type: 'text', validation: (r) => r.required()}),
    defineField({name: 'category', title: 'Category', type: 'string', initialValue: 'general'}),
  ],
  preview: {
    select: {title: 'question', subtitle: 'category'},
  },
})
