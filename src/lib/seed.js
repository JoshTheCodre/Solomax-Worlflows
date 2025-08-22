'use client';

import { addDoc, collection } from 'firebase/firestore';
import { db } from './firebase';
import { TASK_PRIORITY, TASK_TYPES, TASK_STATUS } from './utils';

const dummyTasks = [
  {
    title: "Movie Recap: The Last Adventure",
    description: "Create a 10-minute recap video highlighting key moments and plot twists. Include @v0/raw-footage-last-adventure for the main scenes.",
    type: TASK_TYPES.VOICE_RECAP_LONG,
    priority: TASK_PRIORITY.HIGH,
    assignee: "Merit",
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    status: TASK_STATUS.ACTIVE,
    attachments: []
  },
  {
    title: "Short Recap: Epic Battle Scene",
    description: "Create a 60-second recap of the epic battle scene. Use @cut/battle-sequence-final for the edited footage.",
    type: TASK_TYPES.SHORT_RECAPS,
    priority: TASK_PRIORITY.MEDIUM,
    assignee: "Success",
    deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    status: TASK_STATUS.ACTIVE,
    attachments: []
  },
  {
    title: "Jane Style: Character Analysis",
    description: "Create a Jane-style analysis of the main character's development. Reference @doc/character-profile for background info.",
    type: TASK_TYPES.JANE_STYLE,
    priority: TASK_PRIORITY.HIGH,
    assignee: "Ellen",
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    status: TASK_STATUS.ACTIVE,
    attachments: []
  },
  {
    title: "Moments: Best Comedy Scenes",
    description: "Compile top 5 comedy moments from the movie. Use @v0/comedy-scenes-raw for source material.",
    type: TASK_TYPES.MOMENTS_SHORTS,
    priority: TASK_PRIORITY.MEDIUM,
    assignee: "Joshua",
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    status: TASK_STATUS.ACTIVE,
    attachments: []
  },
  {
    title: "Transfer: Raw Footage Processing",
    description: "Process and organize raw footage from the latest shoot. Create proper naming convention and folder structure.",
    type: TASK_TYPES.TRANSFER,
    priority: TASK_PRIORITY.HIGH,
    assignee: "Ubani",
    deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    status: TASK_STATUS.ACTIVE,
    attachments: []
  }
];

export async function seedDummyTasks() {
  try {
    const tasksCollection = collection(db, 'tasks');
    
    for (const task of dummyTasks) {
      await addDoc(tasksCollection, {
        ...task,
        createdAt: new Date()
      });
    }

    console.log('Successfully seeded dummy tasks');
  } catch (error) {
    console.error('Error seeding dummy tasks:', error);
  }
}
