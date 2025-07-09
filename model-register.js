/**
 * xBrush Model Registration System
 * Handles the complete model registration workflow
 */

class ModelRegistrationApp {
    constructor() {
        this.currentStep = 0;
        this.totalSteps = 6;
        this.registrationData = {};
        this.mediaStream = null;
        this.mediaRecorder = null;
        this.signatureCanvas = null;
        this.uploadedImages = [];
        this.kycAttempts = 0;
        this.maxKycAttempts = 3;
        
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        try {
            this.setupEventListeners();
            this.updateProgressIndicator();
            this.initializeSignatureCanvas();
            this.setupPortfolioUpload();
            
            console.log('Model Registration App initialized');
        } catch (error) {
            console.error('Error initializing Model Registration App:', error);
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Step navigation
        document.querySelectorAll('.step[data-step]').forEach(step => {
            step.addEventListener('click', (e) => {
                const stepNumber = parseInt(step.getAttribute('data-step'));
                this.goToStep(stepNumber);
            });
        });

        // Step 0 - Entry
        document.getElementById('startModelRegistration')?.addEventListener('click', () => {
            this.startRegistration();
        });

        // Step 1 - KYC
        this.setupKYCEventListeners();

        // Step 2 - Contract
        this.setupContractEventListeners();

        // Step 3 - Portfolio
        this.setupPortfolioEventListeners();
    }

    /**
     * Set up KYC event listeners
     */
    setupKYCEventListeners() {
        // ID Upload
        const idUploadArea = document.getElementById('idUploadArea');
        const idUpload = document.getElementById('idUpload');
        
        idUploadArea?.addEventListener('click', () => idUpload.click());
        idUpload?.addEventListener('change', (e) => this.handleIdUpload(e));

        // Face capture
        document.getElementById('startCamera')?.addEventListener('click', () => this.startCamera());
        document.getElementById('capturePhoto')?.addEventListener('click', () => this.capturePhoto());
        document.getElementById('retakePhoto')?.addEventListener('click', () => this.retakePhoto());

        // Video recording
        document.getElementById('generateCode')?.addEventListener('click', () => this.generateRandomCode());
        document.getElementById('startRecording')?.addEventListener('click', () => this.startRecording());
        document.getElementById('stopRecording')?.addEventListener('click', () => this.stopRecording());
        document.getElementById('retakeVideo')?.addEventListener('click', () => this.retakeVideo());

        // Generate initial random code
        this.generateRandomCode();
    }

    /**
     * Set up contract event listeners
     */
    setupContractEventListeners() {
        // Pricing type change
        document.querySelectorAll('input[name="pricingType"]').forEach(radio => {
            radio.addEventListener('change', () => this.updateContractSummary());
        });

        // Period change
        document.querySelectorAll('input[name="contractPeriod"]').forEach(radio => {
            radio.addEventListener('change', () => this.updateContractSummary());
        });

        // Scope changes
        document.querySelectorAll('input[name="highRiskScope"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateContractSummary());
        });

        // 2nd confirmation toggle
        document.getElementById('secondConfirm')?.addEventListener('change', () => this.updateContractSummary());

        // Price inputs
        document.getElementById('flatRate')?.addEventListener('input', () => this.updateContractSummary());
        document.getElementById('shareRate')?.addEventListener('input', () => this.updateContractSummary());
        document.getElementById('customPeriod')?.addEventListener('input', () => this.updateContractSummary());

        // Signature canvas
        document.getElementById('clearSignature')?.addEventListener('click', () => this.clearSignature());

        // Initial contract summary update
        this.updateContractSummary();
    }

    /**
     * Set up portfolio event listeners
     */
    setupPortfolioEventListeners() {
        const dropzone = document.getElementById('portfolioDropzone');
        const fileInput = document.getElementById('portfolioFiles');

        // Dropzone events
        dropzone?.addEventListener('click', () => fileInput.click());
        dropzone?.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });
        dropzone?.addEventListener('dragleave', () => {
            dropzone.classList.remove('dragover');
        });
        dropzone?.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            this.handlePortfolioUpload(e.dataTransfer.files);
        });

        // File input change
        fileInput?.addEventListener('change', (e) => {
            this.handlePortfolioUpload(e.target.files);
        });

        // Gallery controls
        document.getElementById('selectAllImages')?.addEventListener('click', () => this.selectAllImages());
        document.getElementById('deleteSelectedImages')?.addEventListener('click', () => this.deleteSelectedImages());
    }

    /**
     * Go to specific step
     */
    goToStep(stepNumber) {
        if (stepNumber < 0 || stepNumber > this.totalSteps) return;
        
        // Validate step progression
        if (stepNumber > this.currentStep + 1) {
            this.showToast('이전 단계를 먼저 완료해주세요.', 'warning');
            return;
        }

        // Hide current step
        document.getElementById(`modelStep${this.currentStep}`)?.classList.remove('active');
        document.querySelector(`.step[data-step="${this.currentStep}"]`)?.classList.remove('active');

        // Show new step
        this.currentStep = stepNumber;
        document.getElementById(`modelStep${this.currentStep}`)?.classList.add('active');
        document.querySelector(`.step[data-step="${this.currentStep}"]`)?.classList.add('active');

        // Update progress indicators
        this.updateProgressIndicator();
        
        // Handle step-specific actions
        this.handleStepEntry(stepNumber);
    }

    /**
     * Handle step entry actions
     */
    handleStepEntry(stepNumber) {
        switch(stepNumber) {
            case 1:
                this.resetKYCState();
                break;
            case 2:
                this.updateContractSummary();
                break;
            case 3:
                this.updateImageCount();
                break;
        }
    }

    /**
     * Update progress indicator
     */
    updateProgressIndicator() {
        // Update step indicator
        document.querySelector('.current-step').textContent = this.currentStep;
        
        // Update progress line
        const progressPercentage = (this.currentStep / this.totalSteps) * 100;
        const progressLine = document.getElementById('modelProgressLine');
        if (progressLine) {
            progressLine.style.width = `${progressPercentage}%`;
        }

        // Update step buttons
        document.querySelectorAll('.step[data-step]').forEach(step => {
            const stepNum = parseInt(step.getAttribute('data-step'));
            step.classList.remove('active', 'completed');
            
            if (stepNum === this.currentStep) {
                step.classList.add('active');
            } else if (stepNum < this.currentStep) {
                step.classList.add('completed');
            }
        });
    }

    /**
     * Start registration process
     */
    startRegistration() {
        this.goToStep(1);
        this.showToast('모델 등록을 시작합니다!', 'success');
    }

    /**
     * Navigate to next step
     */
    async nextModelStep() {
        if (await this.validateCurrentStep()) {
            this.goToStep(this.currentStep + 1);
        }
    }

    /**
     * Navigate to previous step
     */
    prevModelStep() {
        this.goToStep(this.currentStep - 1);
    }

    /**
     * Validate current step
     */
    async validateCurrentStep() {
        switch(this.currentStep) {
            case 1:
                return this.validateKYC();
            case 2:
                return this.validateContract();
            case 3:
                return await this.validatePortfolio();
            default:
                return true;
        }
    }

    // ==========================================
    // KYC FUNCTIONALITY
    // ==========================================

    /**
     * Handle ID upload
     */
    async handleIdUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            this.showToast('이미지 파일만 업로드 가능합니다.', 'error');
            return;
        }

        try {
            // Show loading state
            this.updateKYCStatus('kycAStatus', 'processing', '신분증 분석 중...');
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                const uploadArea = document.getElementById('idUploadArea');
                uploadArea.innerHTML = `
                    <img src="${e.target.result}" style="max-width: 100%; max-height: 200px; border-radius: 8px;">
                    <p>신분증이 업로드되었습니다</p>
                    <button class="btn btn-outline" onclick="this.closest('#idUploadArea').querySelector('input').click()">다시 선택</button>
                `;
            };
            reader.readAsDataURL(file);

            // Simulate OCR processing
            await this.simulateOCRProcessing(file);
            
            this.registrationData.idDocument = file;
            this.updateKYCStatus('kycAStatus', 'success', '신분증 확인 완료');
            
        } catch (error) {
            this.updateKYCStatus('kycAStatus', 'error', '신분증 분석 실패');
            console.error('ID upload error:', error);
        }
    }

    /**
     * Start camera for face capture
     */
    async startCamera() {
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 640, height: 480 } 
            });
            
            const video = document.getElementById('faceVideo');
            video.srcObject = this.mediaStream;
            
            document.getElementById('startCamera').classList.add('hidden');
            document.getElementById('capturePhoto').classList.remove('hidden');
            
        } catch (error) {
            this.showToast('카메라 접근 권한이 필요합니다.', 'error');
            console.error('Camera access error:', error);
        }
    }

    /**
     * Capture photo from video stream
     */
    capturePhoto() {
        const video = document.getElementById('faceVideo');
        const canvas = document.getElementById('faceCanvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        // Convert to blob and store
        canvas.toBlob((blob) => {
            this.registrationData.facePhoto = blob;
            this.showToast('얼굴 사진이 촬영되었습니다.', 'success');
            
            document.getElementById('capturePhoto').classList.add('hidden');
            document.getElementById('retakePhoto').classList.remove('hidden');
            
            // Enable KYC step B
            this.enableKYCStepB();
        });
        
        // Stop camera
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }
    }

    /**
     * Retake photo
     */
    retakePhoto() {
        document.getElementById('startCamera').classList.remove('hidden');
        document.getElementById('capturePhoto').classList.add('hidden');
        document.getElementById('retakePhoto').classList.add('hidden');
        
        delete this.registrationData.facePhoto;
        this.disableKYCStepB();
    }

    /**
     * Enable KYC Step B
     */
    enableKYCStepB() {
        const stepB = document.getElementById('kycStepB');
        stepB.classList.remove('disabled');
        this.updateKYCStatus('kycBStatus', '', '준비 완료');
    }

    /**
     * Disable KYC Step B
     */
    disableKYCStepB() {
        const stepB = document.getElementById('kycStepB');
        stepB.classList.add('disabled');
        this.updateKYCStatus('kycBStatus', '', '대기 중');
    }

    /**
     * Generate random 6-digit code
     */
    generateRandomCode() {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        document.getElementById('randomCode').textContent = code;
        this.registrationData.randomCode = code;
    }

    /**
     * Start video recording
     */
    async startRecording() {
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: true 
            });
            
            const video = document.getElementById('recordingVideo');
            video.srcObject = this.mediaStream;
            
            // Start recording
            this.mediaRecorder = new MediaRecorder(this.mediaStream);
            const chunks = [];
            
            this.mediaRecorder.ondataavailable = (e) => {
                chunks.push(e.data);
            };
            
            this.mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                this.registrationData.verificationVideo = blob;
                this.processVerificationVideo();
            };
            
            this.mediaRecorder.start();
            
            // Update UI
            document.getElementById('startRecording').classList.add('hidden');
            document.getElementById('stopRecording').classList.remove('hidden');
            document.getElementById('recordingStatus').textContent = '녹화 중';
            document.getElementById('recordingStatus').classList.add('recording');
            
            // Start timer
            this.startRecordingTimer();
            
        } catch (error) {
            this.showToast('카메라/마이크 접근 권한이 필요합니다.', 'error');
            console.error('Recording start error:', error);
        }
    }

    /**
     * Stop video recording
     */
    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
        }
        
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }
        
        // Update UI
        document.getElementById('stopRecording').classList.add('hidden');
        document.getElementById('retakeVideo').classList.remove('hidden');
        document.getElementById('recordingStatus').textContent = '녹화 완료';
        document.getElementById('recordingStatus').classList.remove('recording');
        
        this.stopRecordingTimer();
    }

    /**
     * Retake video
     */
    retakeVideo() {
        document.getElementById('startRecording').classList.remove('hidden');
        document.getElementById('stopRecording').classList.add('hidden');
        document.getElementById('retakeVideo').classList.add('hidden');
        document.getElementById('recordingStatus').textContent = '준비';
        document.getElementById('recordingTimer').textContent = '00:00';
        
        delete this.registrationData.verificationVideo;
    }

    /**
     * Start recording timer
     */
    startRecordingTimer() {
        let seconds = 0;
        this.recordingInterval = setInterval(() => {
            seconds++;
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            document.getElementById('recordingTimer').textContent = 
                `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }, 1000);
    }

    /**
     * Stop recording timer
     */
    stopRecordingTimer() {
        if (this.recordingInterval) {
            clearInterval(this.recordingInterval);
        }
    }

    /**
     * Process verification video
     */
    async processVerificationVideo() {
        try {
            this.updateKYCStatus('kycBStatus', 'processing', '영상 분석 중...');
            
            // Simulate video analysis (STT, deepfake detection, etc.)
            await this.simulateVideoAnalysis();
            
            this.updateKYCStatus('kycBStatus', 'success', '영상 인증 완료');
            this.enableNextStep(1);
            
        } catch (error) {
            this.updateKYCStatus('kycBStatus', 'error', '영상 인증 실패');
            this.handleKYCFailure();
        }
    }

    /**
     * Update KYC status
     */
    updateKYCStatus(elementId, status, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
            element.className = `kyc-status ${status}`;
        }
    }

    /**
     * Reset KYC state
     */
    resetKYCState() {
        this.updateKYCStatus('kycAStatus', '', '대기 중');
        this.updateKYCStatus('kycBStatus', '', '대기 중');
        this.disableKYCStepB();
    }

    /**
     * Validate KYC completion
     */
    validateKYC() {
        const hasIdDocument = this.registrationData.idDocument;
        const hasFacePhoto = this.registrationData.facePhoto;
        const hasVerificationVideo = this.registrationData.verificationVideo;
        
        if (!hasIdDocument || !hasFacePhoto || !hasVerificationVideo) {
            this.showToast('모든 인증 단계를 완료해주세요.', 'warning');
            return false;
        }
        
        return true;
    }

    /**
     * Handle KYC failure
     */
    handleKYCFailure() {
        this.kycAttempts++;
        document.getElementById('kycAttempts').textContent = this.kycAttempts;
        
        if (this.kycAttempts >= this.maxKycAttempts) {
            this.showToast('인증 시도 횟수가 초과되었습니다. 24시간 후 다시 시도해주세요.', 'error');
            // Disable KYC for 24 hours (in real implementation)
        } else {
            this.showToast(`인증에 실패했습니다. ${this.maxKycAttempts - this.kycAttempts}회 더 시도할 수 있습니다.`, 'warning');
        }
    }

    // ==========================================
    // CONTRACT FUNCTIONALITY
    // ==========================================

    /**
     * Update contract summary
     */
    updateContractSummary() {
        // Pricing
        const pricingType = document.querySelector('input[name="pricingType"]:checked')?.value;
        let pricingText = '';
        
        if (pricingType === 'flat') {
            const rate = document.getElementById('flatRate')?.value || '100000';
            pricingText = `정액 ${parseInt(rate).toLocaleString()}원/컷`;
        } else {
            const rate = document.getElementById('shareRate')?.value || '30';
            pricingText = `수익 쉐어 ${rate}%`;
        }
        
        document.getElementById('summaryPricing').textContent = pricingText;

        // Period
        const period = document.querySelector('input[name="contractPeriod"]:checked')?.value;
        let periodText = '';
        
        if (period === 'custom') {
            const customPeriod = document.getElementById('customPeriod')?.value || '12';
            periodText = `${customPeriod}개월`;
        } else {
            periodText = `${period}개월`;
        }
        
        document.getElementById('summaryPeriod').textContent = periodText;

        // High-risk scope
        const highRiskScopes = Array.from(document.querySelectorAll('input[name="highRiskScope"]:checked'))
            .map(cb => cb.value);
        
        const highRiskText = highRiskScopes.length > 0 ? 
            this.getHighRiskScopeNames(highRiskScopes).join(', ') : 
            '선택 안함';
        
        document.getElementById('summaryHighRisk').textContent = highRiskText;

        // 2nd confirmation
        const secondConfirm = document.getElementById('secondConfirm')?.checked;
        document.getElementById('summaryConfirm').textContent = secondConfirm ? '활성화' : '비활성화';

        // Enable/disable next button based on signature
        this.checkContractCompletion();
    }

    /**
     * Get high-risk scope names
     */
    getHighRiskScopeNames(scopes) {
        const names = {
            medical: '의료 광고',
            alcohol: '주류 및 유흥',
            political: '정치 및 선거'
        };
        return scopes.map(scope => names[scope]);
    }

    /**
     * Initialize signature canvas
     */
    initializeSignatureCanvas() {
        const canvas = document.getElementById('signatureCanvas');
        if (!canvas) return;
        
        this.signatureCanvas = {
            canvas: canvas,
            ctx: canvas.getContext('2d'),
            isDrawing: false,
            hasSignature: false
        };
        
        // Set up drawing events
        canvas.addEventListener('mousedown', (e) => this.startSignature(e));
        canvas.addEventListener('mousemove', (e) => this.drawSignature(e));
        canvas.addEventListener('mouseup', () => this.endSignature());
        canvas.addEventListener('touchstart', (e) => this.startSignature(e.touches[0]));
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.drawSignature(e.touches[0]);
        });
        canvas.addEventListener('touchend', () => this.endSignature());
        
        // Configure canvas
        this.signatureCanvas.ctx.strokeStyle = '#2d3748';
        this.signatureCanvas.ctx.lineWidth = 2;
        this.signatureCanvas.ctx.lineCap = 'round';
    }

    /**
     * Start signature drawing
     */
    startSignature(e) {
        this.signatureCanvas.isDrawing = true;
        const rect = this.signatureCanvas.canvas.getBoundingClientRect();
        this.signatureCanvas.ctx.beginPath();
        this.signatureCanvas.ctx.moveTo(
            e.clientX - rect.left,
            e.clientY - rect.top
        );
    }

    /**
     * Draw signature
     */
    drawSignature(e) {
        if (!this.signatureCanvas.isDrawing) return;
        
        const rect = this.signatureCanvas.canvas.getBoundingClientRect();
        this.signatureCanvas.ctx.lineTo(
            e.clientX - rect.left,
            e.clientY - rect.top
        );
        this.signatureCanvas.ctx.stroke();
    }

    /**
     * End signature drawing
     */
    endSignature() {
        if (this.signatureCanvas.isDrawing) {
            this.signatureCanvas.isDrawing = false;
            this.signatureCanvas.hasSignature = true;
            this.checkContractCompletion();
        }
    }

    /**
     * Clear signature
     */
    clearSignature() {
        const canvas = this.signatureCanvas.canvas;
        this.signatureCanvas.ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.signatureCanvas.hasSignature = false;
        this.checkContractCompletion();
    }

    /**
     * Check contract completion
     */
    checkContractCompletion() {
        const isComplete = this.signatureCanvas && this.signatureCanvas.hasSignature;
        const nextButton = document.getElementById('step2Next');
        if (nextButton) {
            nextButton.disabled = !isComplete;
        }
    }

    /**
     * Validate contract completion
     */
    validateContract() {
        if (!this.signatureCanvas || !this.signatureCanvas.hasSignature) {
            this.showToast('전자 서명을 완료해주세요.', 'warning');
            return false;
        }
        
        // Save contract data
        this.saveContractData();
        return true;
    }

    /**
     * Save contract data
     */
    saveContractData() {
        const pricingType = document.querySelector('input[name="pricingType"]:checked')?.value;
        const period = document.querySelector('input[name="contractPeriod"]:checked')?.value;
        const highRiskScopes = Array.from(document.querySelectorAll('input[name="highRiskScope"]:checked'))
            .map(cb => cb.value);
        const secondConfirm = document.getElementById('secondConfirm')?.checked;
        
        this.registrationData.contract = {
            pricingType,
            flatRate: document.getElementById('flatRate')?.value,
            shareRate: document.getElementById('shareRate')?.value,
            period: period === 'custom' ? document.getElementById('customPeriod')?.value : period,
            highRiskScopes,
            secondConfirm,
            signature: this.signatureCanvas.canvas.toDataURL(),
            signedAt: new Date().toISOString()
        };
    }

    /**
     * Complete registration and save to database
     */
    async completeRegistration() {
        try {
            // Initialize database
            await xbrushDB.init();
            
            // Generate unique model ID
            const modelId = `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Convert face photo to base64
            const profileImage = await this.convertBlobToBase64(this.registrationData.facePhoto);
            
            // Create model profile
            const modelData = {
                id: modelId,
                name: this.registrationData.ocrData?.name || 'Unknown',
                tier: 'premium', // All registered models are premium
                status: 'pending', // Require approval
                profileImage: profileImage,
                description: `${this.registrationData.ocrData?.name || 'Unknown'}의 AI 모델`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // Save model profile
            await xbrushDB.saveModel(modelData);
            
            // Process portfolio images
            const processedImages = await this.processPortfolioImages();
            
            // Create contract details with expiration date
            const contractPeriod = parseInt(this.registrationData.contract.period);
            const expiresAt = new Date();
            expiresAt.setMonth(expiresAt.getMonth() + contractPeriod);
            
            // Save model details
            const modelDetails = {
                modelId: modelId,
                kyc: {
                    verified: true,
                    verifiedAt: new Date().toISOString(),
                    attemptCount: this.kycAttempts
                },
                contract: {
                    ...this.registrationData.contract,
                    expiresAt: expiresAt.toISOString(),
                    allowedScopes: ['commercial', 'sns', 'search'] // Default basic scopes
                },
                portfolio: processedImages
            };
            
            await xbrushDB.saveModelDetails(modelDetails);
            
            // Save portfolio images separately for efficient loading
            if (processedImages.length > 0) {
                await xbrushDB.savePortfolioImages(modelId, processedImages);
            }
            
            // Store registration result
            this.registrationData.modelId = modelId;
            this.registrationData.status = 'pending';
            
            this.showToast('모델 등록이 완료되었습니다! 검수 승인을 기다려주세요.', 'success');
            
            // Navigate to next step or show completion
            this.goToStep(5); // Go to review step
            
        } catch (error) {
            console.error('Registration completion error:', error);
            this.showToast('등록 완료 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
        }
    }

    /**
     * Convert blob to base64
     */
    async convertBlobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Process portfolio images for database storage
     */
    async processPortfolioImages() {
        const processedImages = [];
        
        for (let i = 0; i < this.uploadedImages.length; i++) {
            const image = this.uploadedImages[i];
            
            try {
                // Convert image to base64
                const base64 = await this.convertBlobToBase64(image.file);
                
                // Create thumbnail (optional - for performance)
                const thumbnail = await this.createThumbnail(image.file, 200, 200);
                
                // Get image dimensions
                const dimensions = await this.getImageDimensions(image.file);
                
                const processedImage = {
                    id: `img_${Date.now()}_${i}`,
                    name: image.name,
                    url: base64,
                    thumbnail: thumbnail,
                    width: dimensions.width,
                    height: dimensions.height,
                    size: image.file.size,
                    isPrimary: i === 0 // First image is primary
                };
                
                processedImages.push(processedImage);
                
            } catch (error) {
                console.error('Error processing image:', image.name, error);
            }
        }
        
        return processedImages;
    }

    /**
     * Create thumbnail from image file
     */
    async createThumbnail(file, maxWidth, maxHeight) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Calculate thumbnail dimensions
                let { width, height } = img;
                
                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Draw thumbnail
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to base64
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            
            img.onerror = () => resolve(null);
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Get image dimensions
     */
    async getImageDimensions(file) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ width: img.width, height: img.height });
            img.onerror = () => resolve({ width: 0, height: 0 });
            img.src = URL.createObjectURL(file);
        });
    }

    // ==========================================
    // PORTFOLIO FUNCTIONALITY
    // ==========================================

    /**
     * Set up portfolio upload
     */
    setupPortfolioUpload() {
        this.uploadedImages = [];
    }

    /**
     * Handle portfolio upload
     */
    async handlePortfolioUpload(files) {
        const fileArray = Array.from(files);
        const imageFiles = fileArray.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            this.showToast('이미지 파일만 업로드 가능합니다.', 'error');
            return;
        }
        
        if (this.uploadedImages.length + imageFiles.length > 50) {
            this.showToast('최대 50장까지 업로드 가능합니다.', 'warning');
            return;
        }
        
        // Show progress
        this.showUploadProgress(true);
        
        for (let i = 0; i < imageFiles.length; i++) {
            const file = imageFiles[i];
            
            try {
                // Validate image
                await this.validateImageFile(file);
                
                // Create image object
                const imageData = {
                    id: Date.now() + Math.random(),
                    file: file,
                    name: file.name,
                    size: file.size,
                    url: URL.createObjectURL(file),
                    selected: false
                };
                
                this.uploadedImages.push(imageData);
                this.addImageToGallery(imageData);
                
                // Update progress
                const progress = ((i + 1) / imageFiles.length) * 100;
                this.updateUploadProgress(progress);
                
            } catch (error) {
                console.error('Image upload error:', error);
                this.showToast(`${file.name} 업로드 실패: ${error.message}`, 'error');
            }
        }
        
        this.showUploadProgress(false);
        this.updateImageCount();
        this.checkPortfolioCompletion();
    }

    /**
     * Validate image file
     */
    async validateImageFile(file) {
        return new Promise((resolve, reject) => {
            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                reject(new Error('파일 크기는 10MB 이하여야 합니다.'));
                return;
            }
            
            // Check image dimensions
            const img = new Image();
            img.onload = () => {
                if (img.width < 512 || img.height < 512) {
                    reject(new Error('이미지 크기는 최소 512x512px 이상이어야 합니다.'));
                } else {
                    resolve();
                }
            };
            img.onerror = () => {
                reject(new Error('유효하지 않은 이미지 파일입니다.'));
            };
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Add image to gallery
     */
    addImageToGallery(imageData) {
        const galleryGrid = document.getElementById('galleryGrid');
        const imageElement = document.createElement('div');
        imageElement.className = 'gallery-item';
        imageElement.dataset.imageId = imageData.id;
        
        imageElement.innerHTML = `
            <img src="${imageData.url}" alt="${imageData.name}">
            <div class="gallery-item-overlay">
                <div class="gallery-item-controls">
                    <button class="btn btn-primary" onclick="modelApp.selectImage('${imageData.id}')">선택</button>
                    <button class="btn btn-danger" onclick="modelApp.deleteImage('${imageData.id}')">삭제</button>
                </div>
            </div>
        `;
        
        imageElement.addEventListener('click', () => this.toggleImageSelection(imageData.id));
        
        galleryGrid.appendChild(imageElement);
    }

    /**
     * Toggle image selection
     */
    toggleImageSelection(imageId) {
        const image = this.uploadedImages.find(img => img.id == imageId);
        const element = document.querySelector(`[data-image-id="${imageId}"]`);
        
        if (image && element) {
            image.selected = !image.selected;
            element.classList.toggle('selected', image.selected);
        }
    }

    /**
     * Select all images
     */
    selectAllImages() {
        this.uploadedImages.forEach(image => {
            image.selected = true;
            const element = document.querySelector(`[data-image-id="${image.id}"]`);
            element?.classList.add('selected');
        });
    }

    /**
     * Delete selected images
     */
    deleteSelectedImages() {
        const selectedImages = this.uploadedImages.filter(img => img.selected);
        
        if (selectedImages.length === 0) {
            this.showToast('삭제할 이미지를 선택해주세요.', 'warning');
            return;
        }
        
        if (confirm(`선택된 ${selectedImages.length}장의 이미지를 삭제하시겠습니까?`)) {
            selectedImages.forEach(image => {
                this.deleteImage(image.id);
            });
        }
    }

    /**
     * Delete single image
     */
    deleteImage(imageId) {
        const index = this.uploadedImages.findIndex(img => img.id == imageId);
        
        if (index > -1) {
            // Revoke object URL to free memory
            URL.revokeObjectURL(this.uploadedImages[index].url);
            
            // Remove from array
            this.uploadedImages.splice(index, 1);
            
            // Remove from DOM
            const element = document.querySelector(`[data-image-id="${imageId}"]`);
            element?.remove();
            
            this.updateImageCount();
            this.checkPortfolioCompletion();
        }
    }

    /**
     * Show/hide upload progress
     */
    showUploadProgress(show) {
        const progressElement = document.getElementById('uploadProgress');
        if (progressElement) {
            progressElement.style.display = show ? 'block' : 'none';
        }
        
        if (show) {
            this.updateUploadProgress(0);
        }
    }

    /**
     * Update upload progress
     */
    updateUploadProgress(percentage) {
        const progressFill = document.getElementById('uploadProgressFill');
        const progressText = document.getElementById('uploadProgressText');
        
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${Math.round(percentage)}% 완료`;
        }
    }

    /**
     * Update image count
     */
    updateImageCount() {
        const countElement = document.getElementById('imageCount');
        if (countElement) {
            countElement.textContent = this.uploadedImages.length;
        }
    }

    /**
     * Check portfolio completion
     */
    checkPortfolioCompletion() {
        const isComplete = this.uploadedImages.length >= 10;
        const nextButton = document.getElementById('step3Next');
        if (nextButton) {
            nextButton.disabled = !isComplete;
        }
        
        if (isComplete && this.uploadedImages.length === 10) {
            this.showToast('최소 요구사항을 충족했습니다! 더 많은 이미지를 추가하면 더 좋은 결과를 얻을 수 있습니다.', 'success');
        }
    }

    /**
     * Validate portfolio completion
     */
    async validatePortfolio() {
        if (this.uploadedImages.length < 10) {
            this.showToast('최소 10장의 이미지를 업로드해주세요.', 'warning');
            return false;
        }
        
        this.registrationData.portfolio = this.uploadedImages;
        
        // Complete registration and save to database
        await this.completeRegistration();
        
        return true;
    }

    // ==========================================
    // UTILITY FUNCTIONS
    // ==========================================

    /**
     * Enable next step button
     */
    enableNextStep(stepNumber) {
        const nextButton = document.getElementById(`step${stepNumber}Next`);
        if (nextButton) {
            nextButton.disabled = false;
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getToastColor(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease;
        `;
        
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 5000);
    }

    /**
     * Get toast color based on type
     */
    getToastColor(type) {
        const colors = {
            success: '#38a169',
            error: '#e53e3e',
            warning: '#dd6b20',
            info: '#3182ce'
        };
        return colors[type] || colors.info;
    }

    /**
     * Simulate OCR processing
     */
    async simulateOCRProcessing(file) {
        return new Promise(resolve => {
            setTimeout(() => {
                // Simulate successful OCR
                this.registrationData.ocrData = {
                    name: '홍길동',
                    idNumber: '123456-*******',
                    issueDate: '2023-01-01'
                };
                resolve();
            }, 2000);
        });
    }

    /**
     * Simulate video analysis
     */
    async simulateVideoAnalysis() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate analysis results
                const analysisSuccess = Math.random() > 0.2; // 80% success rate
                
                if (analysisSuccess) {
                    this.registrationData.videoAnalysis = {
                        speechText: this.registrationData.randomCode,
                        faceMatches: true,
                        deepfakeDetected: false,
                        audioQuality: 'good'
                    };
                    resolve();
                } else {
                    reject(new Error('Video analysis failed'));
                }
            }, 3000);
        });
    }

    /**
     * Go back to main application
     */
    goBack() {
        if (confirm('모델 등록을 취소하고 메인 페이지로 돌아가시겠습니까?')) {
            window.location.href = 'index.html';
        }
    }
}

// Global functions for HTML onclick handlers
function goBack() {
    modelApp.goBack();
}

function startModelRegistration() {
    modelApp.startRegistration();
}

function nextModelStep() {
    modelApp.nextModelStep();
}

function prevModelStep() {
    modelApp.prevModelStep();
}

// Initialize app when DOM is ready
let modelApp;
document.addEventListener('DOMContentLoaded', () => {
    modelApp = new ModelRegistrationApp();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);