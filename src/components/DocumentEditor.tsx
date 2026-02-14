import { useState, useEffect } from 'react'
import { generatePDF, generatePDFBlob } from '../utils/pdfGenerator'
import { rephraseText } from '../utils/textRephrase'
import './DocumentEditor.css'

export interface Problem {
  id: string
  whatCausedProblem: string // What caused the problem? What did you see/experience?
  howDidYouFindIt: string // How did you find it? What command did you use? What did you see?
  howDidYouFindItImages: string[] // Images for investigation/commands
  whatFixedProblem: string // What fixed the problem? What command did you use? Where?
  howDidYouKnowFixed: string // How did you know the problem was fixed?
  howDidYouKnowFixedImages: string[] // Images for verification/evidence
  images: string[] // General images (legacy support)
}

interface DocumentData {
  assignmentTitle: string
  courseName: string
  studentName: string
  date: string
  problems: Problem[]
  additionalNotes: string
}

const DocumentEditor = () => {
  const [documentData, setDocumentData] = useState<DocumentData>({
    assignmentTitle: '',
    courseName: '',
    studentName: '',
    date: new Date().toISOString().split('T')[0],
    problems: [
      {
        id: Date.now().toString(),
        whatCausedProblem: '',
        howDidYouFindIt: '',
        howDidYouFindItImages: [],
        whatFixedProblem: '',
        howDidYouKnowFixed: '',
        howDidYouKnowFixedImages: [],
        images: [],
      },
    ],
    additionalNotes: '',
  })

  const [rephrasingStates, setRephrasingStates] = useState<{
    [key: string]: boolean
  }>({})
  const [activeProblemId, setActiveProblemId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)

  const handleInputChange = (
    field: keyof Omit<DocumentData, 'problems'>,
    value: string
  ) => {
    setDocumentData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleProblemChange = (
    problemId: string,
    field: keyof Omit<Problem, 'id' | 'images' | 'howDidYouFindItImages' | 'howDidYouKnowFixedImages'>,
    value: string
  ) => {
    setDocumentData((prev) => ({
      ...prev,
      problems: prev.problems.map((problem) =>
        problem.id === problemId ? { ...problem, [field]: value } : problem
      ),
    }))
  }

  const addProblem = () => {
    setDocumentData((prev) => ({
      ...prev,
      problems: [
        ...prev.problems,
      {
        id: Date.now().toString(),
        whatCausedProblem: '',
        howDidYouFindIt: '',
        howDidYouFindItImages: [],
        whatFixedProblem: '',
        howDidYouKnowFixed: '',
        howDidYouKnowFixedImages: [],
        images: [],
      },
      ],
    }))
  }

  const removeProblem = (problemId: string) => {
    if (documentData.problems.length > 1) {
      setDocumentData((prev) => ({
        ...prev,
        problems: prev.problems.filter((p) => p.id !== problemId),
      }))
    }
  }


  const addImageToProblem = (problemId: string, imageData: string, section?: 'howDidYouFindIt' | 'howDidYouKnowFixed') => {
    setDocumentData((prev) => ({
      ...prev,
      problems: prev.problems.map((problem) => {
        if (problem.id === problemId) {
          if (section === 'howDidYouFindIt') {
            return { ...problem, howDidYouFindItImages: [...problem.howDidYouFindItImages, imageData] }
          } else if (section === 'howDidYouKnowFixed') {
            return { ...problem, howDidYouKnowFixedImages: [...problem.howDidYouKnowFixedImages, imageData] }
          } else {
            return { ...problem, images: [...problem.images, imageData] }
          }
        }
        return problem
      }),
    }))
  }

  const handleSectionImageUpload = (
    problemId: string,
    section: 'howDidYouFindIt' | 'howDidYouKnowFixed',
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64String = reader.result as string
          addImageToProblem(problemId, base64String, section)
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const removeSectionImage = (
    problemId: string,
    section: 'howDidYouFindIt' | 'howDidYouKnowFixed',
    imageIndex: number
  ) => {
    setDocumentData((prev) => ({
      ...prev,
      problems: prev.problems.map((problem) => {
        if (problem.id === problemId) {
          if (section === 'howDidYouFindIt') {
            return {
              ...problem,
              howDidYouFindItImages: problem.howDidYouFindItImages.filter((_, idx) => idx !== imageIndex),
            }
          } else {
            return {
              ...problem,
              howDidYouKnowFixedImages: problem.howDidYouKnowFixedImages.filter((_, idx) => idx !== imageIndex),
            }
          }
        }
        return problem
      }),
    }))
  }

  // Show toast notification
  const showToast = (message: string) => {
    setToastMessage(message)
    setTimeout(() => {
      setToastMessage(null)
    }, 3000)
  }

  // Find the closest problem card and section from an element
  const findProblemAndSection = (element: HTMLElement | null): { problemId: string | null; section: 'howDidYouFindIt' | 'howDidYouKnowFixed' | undefined } => {
    if (!element) return { problemId: null, section: undefined }

    // Check if we're in a section-specific image area
    const sectionContainer = element.closest('.section-images')
    if (sectionContainer) {
      const sectionId = sectionContainer.getAttribute('data-section')
      const problemCard = element.closest('.problem-card')
      if (problemCard) {
        const problemId = problemCard.getAttribute('data-problem-id')
        if (problemId && (sectionId === 'howDidYouFindIt' || sectionId === 'howDidYouKnowFixed')) {
          return { problemId, section: sectionId as 'howDidYouFindIt' | 'howDidYouKnowFixed' }
        }
      }
    }

    // Check if we're in a problem card (find the closest one)
    const problemCard = element.closest('.problem-card')
    if (problemCard) {
      const problemId = problemCard.getAttribute('data-problem-id')
      if (problemId) {
        // Try to determine section based on scroll position or nearby textarea
        const textareas = problemCard.querySelectorAll('textarea')
        let closestTextarea: Element | null = null
        let minDistance = Infinity

        textareas.forEach((textarea) => {
          const rect = textarea.getBoundingClientRect()
          const distance = Math.abs(rect.top - window.innerHeight / 2)
          if (distance < minDistance) {
            minDistance = distance
            closestTextarea = textarea
          }
        })

        // Determine section based on which textarea is closest
        if (closestTextarea) {
          const textareaElement = closestTextarea as HTMLTextAreaElement
          const textareaId = textareaElement.id || ''
          const prevSibling = textareaElement.previousElementSibling as HTMLElement | null
          if (textareaId.includes('howDidYouFindIt') || prevSibling?.querySelector('h4')?.textContent?.includes('How Did You Find')) {
            return { problemId, section: 'howDidYouFindIt' }
          } else if (textareaId.includes('howDidYouKnowFixed') || prevSibling?.querySelector('h4')?.textContent?.includes('How Did You Know')) {
            return { problemId, section: 'howDidYouKnowFixed' }
          }
        }

        return { problemId, section: undefined }
      }
    }

    return { problemId: null, section: undefined }
  }

  // Handle paste events for images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      const target = e.target as HTMLElement

      // Check if we're pasting into a textarea or input - allow text paste but also check for images
      const isTextInput = target.tagName === 'TEXTAREA' || target.tagName === 'INPUT'
      
      // Check if clipboard contains images
      let hasImages = false
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          hasImages = true
          break
        }
      }

      if (!hasImages) return // No images in clipboard, let normal paste work

      // Find the best problem and section to add the image to
      let problemId: string | null = null
      let section: 'howDidYouFindIt' | 'howDidYouKnowFixed' | undefined = undefined

      if (isTextInput) {
        // If pasting in a textarea, find the problem card it belongs to
        const result = findProblemAndSection(target)
        problemId = result.problemId
        section = result.section
      } else {
        // If not in a textarea, use the clicked/hovered element
        const result = findProblemAndSection(target)
        problemId = result.problemId || activeProblemId || documentData.problems[0]?.id
        section = result.section
      }

      // Fallback to active problem or first problem
      if (!problemId) {
        problemId = activeProblemId || documentData.problems[0]?.id
      }

      if (!problemId) return

      // Prevent default only if we're going to handle the image
      e.preventDefault()

      let imagesPasted = 0
      const promises: Promise<void>[] = []

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            const promise = new Promise<void>((resolve) => {
              const reader = new FileReader()
              reader.onloadend = () => {
                const base64String = reader.result as string
                addImageToProblem(problemId!, base64String, section)
                imagesPasted++
                resolve()
              }
              reader.onerror = () => resolve()
              reader.readAsDataURL(file)
            })
            promises.push(promise)
          }
        }
      }

      // Show toast notification after all images are processed
      Promise.all(promises).then(() => {
        if (imagesPasted > 0) {
          const problemIndex = documentData.problems.findIndex(p => p.id === problemId) + 1
          const sectionName = section === 'howDidYouFindIt' 
            ? 'Investigation Evidence' 
            : section === 'howDidYouKnowFixed' 
            ? 'Verification Evidence' 
            : 'Problem'
          showToast(`✅ ${imagesPasted} image${imagesPasted > 1 ? 's' : ''} added to Problem ${problemIndex} - ${sectionName}`)
        }
      })
    }

    window.addEventListener('paste', handlePaste)
    return () => {
      window.removeEventListener('paste', handlePaste)
    }
  }, [activeProblemId, documentData.problems])

  // Cleanup: restore body scroll when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const handleGeneratePDF = async () => {
    await generatePDF(documentData)
  }

  const handlePreviewPDF = async () => {
    setIsGeneratingPreview(true)
    try {
      const blob = await generatePDFBlob(documentData)
      const url = URL.createObjectURL(blob)
      setPreviewPdfUrl(url)
      // Simple body scroll lock - just prevent overflow
      document.body.style.overflow = 'hidden'
    } catch (error) {
      console.error('Error generating PDF preview:', error)
      showToast('Failed to generate PDF preview. Please try again.')
    } finally {
      setIsGeneratingPreview(false)
    }
  }

  const closePreview = () => {
    if (previewPdfUrl) {
      URL.revokeObjectURL(previewPdfUrl)
      setPreviewPdfUrl(null)
    }
    // Restore body scroll when modal is closed
    document.body.style.overflow = ''
  }

  const handleRephrase = async (
    type: 'problem' | 'additionalNotes',
    problemId?: string,
    field?: keyof Omit<Problem, 'id' | 'images' | 'howDidYouFindItImages' | 'howDidYouKnowFixedImages'>
  ) => {
    const key = problemId && field ? `${type}-${problemId}-${field}` : `${type}`
    
    setRephrasingStates((prev) => ({ ...prev, [key]: true }))

    try {
      let currentText = ''
      let improvedText = ''

      if (type === 'problem' && problemId && field) {
        const problem = documentData.problems.find((p) => p.id === problemId)
        if (problem) {
          const fieldValue = problem[field]
          if (typeof fieldValue === 'string') {
            currentText = fieldValue
            improvedText = await rephraseText(currentText)
            handleProblemChange(problemId, field, improvedText)
          }
        }
      } else if (type === 'additionalNotes') {
        currentText = documentData.additionalNotes
        improvedText = await rephraseText(currentText)
        handleInputChange('additionalNotes', improvedText)
      }
    } catch (error) {
      console.error('Error rephrasing text:', error)
      alert('Failed to rephrase text. Please try again.')
    } finally {
      setRephrasingStates((prev) => ({ ...prev, [key]: false }))
    }
  }

  return (
    <div className="document-editor">
      <div className="editor-header">
        <h2>Document Your Assignment</h2>
        <div className="action-buttons">
          <button
            onClick={handlePreviewPDF}
            className="preview-btn"
            disabled={
              !documentData.assignmentTitle ||
              !documentData.courseName ||
              !documentData.studentName ||
              isGeneratingPreview
            }
          >
            {isGeneratingPreview ? '⏳ Generating...' : '👁️ Preview PDF'}
          </button>
          <button
            onClick={handleGeneratePDF}
            className="download-btn"
            disabled={
              !documentData.assignmentTitle ||
              !documentData.courseName ||
              !documentData.studentName
            }
          >
            📄 Download PDF
          </button>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="assignmentTitle">Assignment Title *</label>
          <input
            type="text"
            id="assignmentTitle"
            value={documentData.assignmentTitle}
            onChange={(e) =>
              handleInputChange('assignmentTitle', e.target.value)
            }
            placeholder="e.g., Network Security Audit"
          />
        </div>

        <div className="form-group">
          <label htmlFor="courseName">Course Name *</label>
          <input
            type="text"
            id="courseName"
            value={documentData.courseName}
            onChange={(e) => handleInputChange('courseName', e.target.value)}
            placeholder="e.g., IT Cybersecurity Fundamentals"
          />
        </div>

        <div className="form-group">
          <label htmlFor="studentName">Student Name *</label>
          <input
            type="text"
            id="studentName"
            value={documentData.studentName}
            onChange={(e) => handleInputChange('studentName', e.target.value)}
            placeholder="Your full name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="date">Date *</label>
          <input
            type="date"
            id="date"
            value={documentData.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
          />
        </div>
      </div>

      <div className="problems-section">
        <div className="problems-header">
          <h2>Problems</h2>
          <button onClick={addProblem} className="add-problem-btn">
            + Add Problem
          </button>
        </div>

        {documentData.problems.map((problem, index) => (
          <div
            key={problem.id}
            className="problem-card"
            onMouseEnter={() => setActiveProblemId(problem.id)}
            onMouseLeave={() => {
              // Keep active if focused
              const activeElement = document.activeElement
              if (!activeElement || !activeElement.closest(`.problem-card[data-problem-id="${problem.id}"]`)) {
                setActiveProblemId(null)
              }
            }}
            data-problem-id={problem.id}
          >
            <div className="problem-card-header">
              <h3>Problem {index + 1}</h3>
              {documentData.problems.length > 1 && (
                <button
                  onClick={() => removeProblem(problem.id)}
                  className="remove-problem-btn"
                  title="Remove Problem"
                >
                  ×
                </button>
              )}
            </div>

            <div className="form-section">
              <div className="textarea-header">
                <label>
                  <h4>1. What Caused the Problem?</h4>
                  <p className="label-hint">
                    What did you see/experience? Describe what caused the problem.
                  </p>
                </label>
                <button
                  onClick={() =>
                    handleRephrase('problem', problem.id, 'whatCausedProblem')
                  }
                  className="rephrase-btn"
                  disabled={
                    !problem.whatCausedProblem ||
                    rephrasingStates[`problem-${problem.id}-whatCausedProblem`]
                  }
                  title="Rephrase and improve text"
                >
                  {rephrasingStates[`problem-${problem.id}-whatCausedProblem`]
                    ? '⏳ Processing...'
                    : '✨ Rephrase'}
                </button>
              </div>
              <textarea
                value={problem.whatCausedProblem}
                onChange={(e) =>
                  handleProblemChange(
                    problem.id,
                    'whatCausedProblem',
                    e.target.value
                  )
                }
                placeholder="Describe what caused the problem. What did you see or experience?"
                rows={4}
              />
            </div>

            <div className="form-section">
              <div className="textarea-header">
                <label>
                  <h4>2. How Did You Find the Problem?</h4>
                  <p className="label-hint">
                    What command did you use? What did you see? Describe your investigation process.
                  </p>
                </label>
                <button
                  onClick={() =>
                    handleRephrase('problem', problem.id, 'howDidYouFindIt')
                  }
                  className="rephrase-btn"
                  disabled={
                    !problem.howDidYouFindIt ||
                    rephrasingStates[`problem-${problem.id}-howDidYouFindIt`]
                  }
                  title="Rephrase and improve text"
                >
                  {rephrasingStates[`problem-${problem.id}-howDidYouFindIt`]
                    ? '⏳ Processing...'
                    : '✨ Rephrase'}
                </button>
              </div>
              <textarea
                id={`howDidYouFindIt-${problem.id}`}
                value={problem.howDidYouFindIt}
                onChange={(e) =>
                  handleProblemChange(problem.id, 'howDidYouFindIt', e.target.value)
                }
                placeholder="What commands did you use? What output did you see? How did you investigate and identify the issue?"
                rows={4}
                onFocus={() => setActiveProblemId(problem.id)}
              />
              <div className="section-images" data-section="howDidYouFindIt">
                <label className="section-images-label">
                  <span>📸 Evidence Screenshots</span>
                  <span className="section-images-hint">Screenshots of commands, outputs, or investigation steps</span>
                </label>
                <div className="image-upload-area">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleSectionImageUpload(problem.id, 'howDidYouFindIt', e)}
                    className="image-input"
                    id={`howDidYouFindIt-images-${problem.id}`}
                  />
                  <label
                    htmlFor={`howDidYouFindIt-images-${problem.id}`}
                    className="image-upload-label"
                  >
                    <span className="upload-icon">📷</span>
                    <span>Add Screenshots</span>
                    <span className="paste-hint">or Ctrl+V</span>
                  </label>
                </div>
                {problem.howDidYouFindItImages && problem.howDidYouFindItImages.length > 0 && (
                  <div className="image-preview-grid">
                    {problem.howDidYouFindItImages.map((image, imgIndex) => (
                      <div key={imgIndex} className="image-preview-wrapper">
                        <img
                          src={image}
                          alt={`Investigation Image ${imgIndex + 1}`}
                          className="image-preview"
                        />
                        <button
                          onClick={() => removeSectionImage(problem.id, 'howDidYouFindIt', imgIndex)}
                          className="remove-image-btn"
                          title="Remove Image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-section">
              <div className="textarea-header">
                <label>
                  <h4>3. What Fixed the Problem?</h4>
                  <p className="label-hint">
                    What command did you use? Where? Describe the solution you implemented.
                  </p>
                </label>
                <button
                  onClick={() =>
                    handleRephrase('problem', problem.id, 'whatFixedProblem')
                  }
                  className="rephrase-btn"
                  disabled={
                    !problem.whatFixedProblem ||
                    rephrasingStates[`problem-${problem.id}-whatFixedProblem`]
                  }
                  title="Rephrase and improve text"
                >
                  {rephrasingStates[`problem-${problem.id}-whatFixedProblem`]
                    ? '⏳ Processing...'
                    : '✨ Rephrase'}
                </button>
              </div>
              <textarea
                value={problem.whatFixedProblem}
                onChange={(e) =>
                  handleProblemChange(
                    problem.id,
                    'whatFixedProblem',
                    e.target.value
                  )
                }
                placeholder="What commands did you use to fix it? Where did you apply the fix? Describe the solution step-by-step."
                rows={4}
              />
            </div>

            <div className="form-section">
              <div className="textarea-header">
                <label>
                  <h4>4. How Did You Know the Problem Was Fixed?</h4>
                  <p className="label-hint">
                    How did you verify the problem was resolved? What evidence confirmed the fix?
                  </p>
                </label>
                <button
                  onClick={() =>
                    handleRephrase('problem', problem.id, 'howDidYouKnowFixed')
                  }
                  className="rephrase-btn"
                  disabled={
                    !problem.howDidYouKnowFixed ||
                    rephrasingStates[`problem-${problem.id}-howDidYouKnowFixed`]
                  }
                  title="Rephrase and improve text"
                >
                  {rephrasingStates[`problem-${problem.id}-howDidYouKnowFixed`]
                    ? '⏳ Processing...'
                    : '✨ Rephrase'}
                </button>
              </div>
              <textarea
                id={`howDidYouKnowFixed-${problem.id}`}
                value={problem.howDidYouKnowFixed}
                onChange={(e) =>
                  handleProblemChange(
                    problem.id,
                    'howDidYouKnowFixed',
                    e.target.value
                  )
                }
                placeholder="How did you verify the fix worked? What commands did you run? What output confirmed the problem was resolved?"
                rows={4}
                onFocus={() => setActiveProblemId(problem.id)}
              />
              <div className="section-images" data-section="howDidYouKnowFixed">
                <label className="section-images-label">
                  <span>📸 Verification Screenshots</span>
                  <span className="section-images-hint">Screenshots proving the problem was fixed (before/after, test results, etc.)</span>
                </label>
                <div className="image-upload-area">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleSectionImageUpload(problem.id, 'howDidYouKnowFixed', e)}
                    className="image-input"
                    id={`howDidYouKnowFixed-images-${problem.id}`}
                  />
                  <label
                    htmlFor={`howDidYouKnowFixed-images-${problem.id}`}
                    className="image-upload-label"
                  >
                    <span className="upload-icon">📷</span>
                    <span>Add Screenshots</span>
                    <span className="paste-hint">or Ctrl+V</span>
                  </label>
                </div>
                {problem.howDidYouKnowFixedImages && problem.howDidYouKnowFixedImages.length > 0 && (
                  <div className="image-preview-grid">
                    {problem.howDidYouKnowFixedImages.map((image, imgIndex) => (
                      <div key={imgIndex} className="image-preview-wrapper">
                        <img
                          src={image}
                          alt={`Verification Image ${imgIndex + 1}`}
                          className="image-preview"
                        />
                        <button
                          onClick={() => removeSectionImage(problem.id, 'howDidYouKnowFixed', imgIndex)}
                          className="remove-image-btn"
                          title="Remove Image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div className="add-problem-bottom">
          <button onClick={addProblem} className="add-problem-btn">
            + Add Another Problem
          </button>
        </div>
      </div>

      <div className="form-section">
        <div className="textarea-header">
          <label htmlFor="additionalNotes">
            <h3>Additional Notes</h3>
            <p className="label-hint">Any additional observations, learnings, or comments</p>
          </label>
          <button
            onClick={() => handleRephrase('additionalNotes')}
            className="rephrase-btn"
            disabled={
              !documentData.additionalNotes ||
              rephrasingStates['additionalNotes']
            }
            title="Rephrase and improve text"
          >
            {rephrasingStates['additionalNotes']
              ? '⏳ Processing...'
              : '✨ Rephrase'}
          </button>
        </div>
        <textarea
          id="additionalNotes"
          value={documentData.additionalNotes}
          onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
          placeholder="Add any additional notes, observations, or key learnings..."
          rows={5}
        />
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification">
          {toastMessage}
        </div>
      )}

      {/* PDF Preview Modal */}
      {previewPdfUrl && (
        <div className="pdf-preview-modal" onClick={closePreview}>
          <div className="pdf-preview-content" onClick={(e) => e.stopPropagation()}>
            <div className="pdf-preview-header">
              <h3>PDF Preview</h3>
              <button onClick={closePreview} className="close-preview-btn" title="Close Preview">
                ×
              </button>
            </div>
            <div className="pdf-preview-iframe-container">
              <iframe
                src={previewPdfUrl}
                className="pdf-preview-iframe"
                title="PDF Preview"
              />
            </div>
            <div className="pdf-preview-footer">
              <button onClick={handleGeneratePDF} className="download-from-preview-btn">
                📄 Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DocumentEditor
