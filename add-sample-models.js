/**
 * Script to add sample models to Firestore
 * Run with: node add-sample-models.js
 */

import admin from 'firebase-admin';

// Initialize Firebase Admin (using default credentials)
admin.initializeApp({
  projectId: 'xbrush-moviemaker-mvp'
});

const db = admin.firestore();

const sampleModels = [
    {
        id: 'model_' + Date.now() + '_1',
        personalInfo: {
            name: "김지수",
            intro: "밝고 친근한 20대 여성 모델입니다",
            description: "패션과 뷰티 분야에서 다양한 경험을 쌓은 전문 모델입니다. 밝은 미소와 자연스러운 표정 연기가 강점입니다.",
            categories: ["fashion", "beauty"]
        },
        portfolio: {
            thumbnailUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop",
            images: []
        },
        contract: {
            pricingType: "perProject",
            basePrice: 500000,
            usageRights: ["commercial", "editorial"],
            contractPeriod: 12
        },
        kyc: {
            verified: true,
            verificationDate: new Date().toISOString()
        },
        status: "active",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
        id: 'model_' + Date.now() + '_2',
        personalInfo: {
            name: "이준호",
            intro: "전문적이고 신뢰감 있는 30대 남성 모델",
            description: "비즈니스와 라이프스타일 광고에 특화된 모델입니다. 안정적인 연기력과 다양한 컨셉 소화 능력을 보유하고 있습니다.",
            categories: ["lifestyle", "tech"]
        },
        portfolio: {
            thumbnailUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop",
            images: []
        },
        contract: {
            pricingType: "perProject",
            basePrice: 700000,
            usageRights: ["commercial"],
            contractPeriod: 12
        },
        kyc: {
            verified: true,
            verificationDate: new Date().toISOString()
        },
        status: "active",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
        id: 'model_' + Date.now() + '_3',
        personalInfo: {
            name: "박서연",
            intro: "건강하고 활기찬 이미지의 피트니스 모델",
            description: "스포츠와 건강 관련 제품 광고에 최적화된 모델입니다. 운동 전문가로서의 신뢰성과 건강한 이미지를 전달합니다.",
            categories: ["lifestyle", "food"]
        },
        portfolio: {
            thumbnailUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop",
            images: []
        },
        contract: {
            pricingType: "perProject",
            basePrice: 450000,
            usageRights: ["commercial", "social"],
            contractPeriod: 12
        },
        kyc: {
            verified: true,
            verificationDate: new Date().toISOString()
        },
        status: "active",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
        id: 'model_' + Date.now() + '_4',
        personalInfo: {
            name: "최유진",
            intro: "세련되고 우아한 럭셔리 브랜드 전문 모델",
            description: "하이엔드 패션과 뷰티 브랜드에서 활동하는 프로페셔널 모델입니다. 고급스러운 이미지와 세련된 포즈가 특징입니다.",
            categories: ["fashion", "beauty", "lifestyle"]
        },
        portfolio: {
            thumbnailUrl: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=500&fit=crop",
            images: []
        },
        contract: {
            pricingType: "perProject",
            basePrice: 1000000,
            usageRights: ["commercial", "editorial", "exclusive"],
            contractPeriod: 12
        },
        kyc: {
            verified: true,
            verificationDate: new Date().toISOString()
        },
        status: "active",
        tier: "premium",
        premiumBadge: "⭐ 프리미엄 모델",
        sortPriority: 100,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
        id: 'model_' + Date.now() + '_5',
        personalInfo: {
            name: "정민수",
            intro: "따뜻하고 친근한 가족 컨셉 전문 모델",
            description: "가족 브랜드와 생활용품 광고에 적합한 모델입니다. 자연스럽고 편안한 이미지로 신뢰감을 전달합니다.",
            categories: ["lifestyle", "food"]
        },
        portfolio: {
            thumbnailUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=500&fit=crop",
            images: []
        },
        contract: {
            pricingType: "perProject",
            basePrice: 600000,
            usageRights: ["commercial", "social"],
            contractPeriod: 12
        },
        kyc: {
            verified: true,
            verificationDate: new Date().toISOString()
        },
        status: "active",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }
];

async function addSampleModels() {
    console.log('Adding sample models to Firestore...');
    
    try {
        const batch = db.batch();
        
        sampleModels.forEach(model => {
            const docRef = db.collection('models').doc(model.id);
            batch.set(docRef, model);
            console.log(`Prepared model: ${model.personalInfo.name} (${model.id})`);
        });
        
        await batch.commit();
        console.log('✅ Successfully added all sample models!');
        
        // Verify the models were added
        const snapshot = await db.collection('models').where('status', '==', 'active').get();
        console.log(`✅ Verification: Found ${snapshot.size} active models in database`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding sample models:', error);
        process.exit(1);
    }
}

addSampleModels();