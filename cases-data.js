window.CASE_FILES_DATA = {
    sources: [
        { id: 'tra-an', name: 'Tra Án', channelUrl: '' },
        { id: 'duy7ham', name: 'Duy7ham', channelUrl: '' }
    ],

    // Một hồ sơ = một vụ án. Một vụ án có thể chứa nhiều tập từ cả hai nguồn.
    // duration: số giây đã xác minh, để null nếu chưa xác minh.
    // rightsStatus: 'licensed' | 'pending' | 'none' | 'demo'
    // audioUrl chỉ được dùng khi rightsStatus === 'licensed' và là file audio được cấp quyền (không phải link YouTube).
    // youtubeVideoId / youtubeUrl chỉ để tham chiếu video nguồn.
    // facts[].type: 'confirmed' | 'alleged' | 'theory'
    // chapters: [{ start: giây, title: '...' }]
    cases: [
        {
            id: 'CF-DEMO-001',
            demo: true,
            featured: true,
            title: 'Demo Case 001',
            country: '',
            year: null,
            category: 'Demo',
            status: 'demo',
            synopsis: 'Placeholder case used to preview the layout. Replace it with a real, verified case.',
            cover: '',
            facts: [
                { type: 'confirmed', text: 'Demo only: a confirmed, verifiable fact would appear here.' },
                { type: 'alleged', text: 'Demo only: an allegation would appear here, clearly labeled.' },
                { type: 'theory', text: 'Demo only: a theory or speculation would appear here, clearly labeled.' }
            ],
            episodes: [
                {
                    id: 'CF-DEMO-001-E01',
                    title: 'Demo Episode',
                    sourceChannel: 'tra-an',
                    duration: null,
                    audioUrl: '',
                    youtubeVideoId: '',
                    youtubeUrl: '',
                    thumbnail: '',
                    chapters: [],
                    rightsStatus: 'demo'
                }
            ]
        },
        {
            id: 'CF-DEMO-002',
            demo: true,
            featured: true,
            title: 'Demo Case 002',
            country: '',
            year: null,
            category: 'Demo',
            status: 'demo',
            synopsis: 'Placeholder case from the second source. No real content has been added yet.',
            cover: '',
            facts: [],
            episodes: [
                {
                    id: 'CF-DEMO-002-E01',
                    title: 'Demo Episode',
                    sourceChannel: 'duy7ham',
                    duration: null,
                    audioUrl: '',
                    youtubeVideoId: '',
                    youtubeUrl: '',
                    thumbnail: '',
                    chapters: [],
                    rightsStatus: 'demo'
                }
            ]
        },
        {
            id: 'CF-DEMO-003',
            demo: true,
            featured: false,
            title: 'Demo Case 003 (two sources)',
            country: '',
            year: null,
            category: 'Demo',
            status: 'demo',
            synopsis: 'Placeholder showing one case that holds episodes from both sources without duplicating the case.',
            cover: '',
            facts: [],
            episodes: [
                {
                    id: 'CF-DEMO-003-E01',
                    title: 'Demo Episode (Tra Án)',
                    sourceChannel: 'tra-an',
                    duration: null,
                    audioUrl: '',
                    youtubeVideoId: '',
                    youtubeUrl: '',
                    thumbnail: '',
                    chapters: [],
                    rightsStatus: 'demo'
                },
                {
                    id: 'CF-DEMO-003-E02',
                    title: 'Demo Episode (Duy7ham)',
                    sourceChannel: 'duy7ham',
                    duration: null,
                    audioUrl: '',
                    youtubeVideoId: '',
                    youtubeUrl: '',
                    thumbnail: '',
                    chapters: [],
                    rightsStatus: 'demo'
                }
            ]
        }
    ]
};