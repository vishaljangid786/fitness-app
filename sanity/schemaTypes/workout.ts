import {defineType, defineField, defineArrayMember} from 'sanity'

export default defineType({
  name: 'workout',
  title: 'Workout',
  type: 'document',
  icon: () => '💪',
  fields: [
    defineField({
      name: 'userId',
      title: 'User ID',
      type: 'string',
      description: 'The Clerk ID of the user who performed this workout.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'dateTime',
      title: 'Workout Date & Time',
      type: 'datetime',
      description: 'The exact date and time when this workout was performed.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'duration',
      title: 'Duration (seconds)',
      type: 'number',
      description: 'The duration of the workout in seconds.',
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'exercises',
      title: 'Exercises',
      type: 'array',
      description: 'List of exercises performed in this workout with their details.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'exerciseSet',
          fields: [
            defineField({
              name: 'exercise',
              title: 'Exercise',
              type: 'reference',
              to: [{type: 'exercise'}],
              description: 'Reference to the exercise performed.',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'sets',
              title: 'Sets',
              type: 'array',
              description: 'Each set performed for this exercise.',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'set',
                  fields: [
                    defineField({
                      name: 'reps',
                      title: 'Reps',
                      type: 'number',
                      description: 'Number of repetitions performed.',
                      validation: (Rule) => Rule.required().min(0),
                    }),
                    defineField({
                      name: 'weight',
                      title: 'Weight',
                      type: 'number',
                      description: 'The weight used for this set.',
                      validation: (Rule) => Rule.required().min(0),
                    }),
                    defineField({
                      name: 'weightUnit',
                      title: 'Weight Unit',
                      type: 'string',
                      description: 'The unit of measurement for the weight.',
                      options: {
                        list: [
                          {title: 'Pounds (lbs)', value: 'lbs'},
                          {title: 'Kilograms (kg)', value: 'kg'},
                        ],
                        layout: 'radio',
                      },
                      initialValue: 'lbs',
                      validation: (Rule) => Rule.required(),
                    }),
                  ],
                  preview: {
                    select: {
                      reps: 'reps',
                      weight: 'weight',
                      weightUnit: 'weightUnit',
                    },
                    prepare({reps, weight, weightUnit}) {
                      let repStr = typeof reps === 'number' ? `${reps} reps` : 'N/A reps'
                      let weightStr =
                        typeof weight === 'number' && weightUnit ? `${weight} ${weightUnit}` : 'N/A'
                      return {
                        title: `${repStr} @ ${weightStr}`,
                      }
                    },
                  },
                }),
              ],
              validation: (Rule) => Rule.required().min(1),
            }),
          ],
          preview: {
            select: {
              exerciseName: 'exercise.name',
              sets: 'sets',
            },
            prepare({exerciseName, sets}) {
              const setsCount = Array.isArray(sets) ? sets.length : 0
              return {
                title: exerciseName || 'Exercise',
                subtitle: `${setsCount} set${setsCount !== 1 ? 's' : ''}`,
              }
            },
          },
        }),
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  preview: {
    select: {
      dateTime: 'dateTime',
      exerciseCount: 'exercises',
      duration: 'duration',
    },
    prepare({dateTime, exerciseCount, duration}) {
      const exerciseCountValue = exerciseCount?.length || 0
      const minutes = duration ? Math.floor(duration / 60) : 0
      const seconds = duration ? duration % 60 : 0
      const durationText = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`

      return {
        title: dateTime
          ? `Workout - ${new Date(dateTime).toLocaleDateString()}`
          : 'Workout - No date',
        subtitle: `${durationText} • ${exerciseCountValue} exercise${exerciseCountValue !== 1 ? 's' : ''}`,
      }
    },
  },
})
