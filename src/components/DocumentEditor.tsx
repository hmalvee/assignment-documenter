import { useState } from 'react'
import { generatePDF } from '../utils/pdfGenerator'
import { rephraseText } from '../utils/textRephrase'
import './DocumentEditor.css'

export interface Problem {
  id: string
  problemDescription: string
  issuesIdentified: string
  solutionsImplemented: string
  images: string[] // Base64 encoded images
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
        problemDescription: '',
        issuesIdentified: '',
        solutionsImplemented: '',
        images: [],
      },
    ],
    additionalNotes: '',
  })

  const [rephrasingStates, setRephrasingStates] = useState<{
    [key: string]: boolean
  }>({})

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
    field: keyof Omit<Problem, 'id' | 'images'>,
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
          problemDescription: '',
          issuesIdentified: '',
          solutionsImplemented: '',
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

  const handleImageUpload = (
    problemId: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64String = reader.result as string
          setDocumentData((prev) => ({
            ...prev,
            problems: prev.problems.map((problem) =>
              problem.id === problemId
                ? { ...problem, images: [...problem.images, base64String] }
                : problem
            ),
          }))
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const removeImage = (problemId: string, imageIndex: number) => {
    setDocumentData((prev) => ({
      ...prev,
      problems: prev.problems.map((problem) =>
        problem.id === problemId
          ? {
              ...problem,
              images: problem.images.filter((_, idx) => idx !== imageIndex),
            }
          : problem
      ),
    }))
  }

  const handleGeneratePDF = async () => {
    await generatePDF(documentData)
  }

  const handleRephrase = async (
    type: 'problem' | 'additionalNotes',
    problemId?: string,
    field?: keyof Omit<Problem, 'id' | 'images'>
  ) => {
    const key = problemId && field ? `${type}-${problemId}-${field}` : `${type}`
    
    setRephrasingStates((prev) => ({ ...prev, [key]: true }))

    try {
      let currentText = ''
      let improvedText = ''

      if (type === 'problem' && problemId && field) {
        const problem = documentData.problems.find((p) => p.id === problemId)
        if (problem) {
          currentText = problem[field] || ''
          improvedText = await rephraseText(currentText)
          handleProblemChange(problemId, field, improvedText)
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
          <div key={problem.id} className="problem-card">
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
                  <h4>Problem Description</h4>
                  <p className="label-hint">
                    Describe the assignment or problem you were working on
                  </p>
                </label>
                <button
                  onClick={() =>
                    handleRephrase('problem', problem.id, 'problemDescription')
                  }
                  className="rephrase-btn"
                  disabled={
                    !problem.problemDescription ||
                    rephrasingStates[`problem-${problem.id}-problemDescription`]
                  }
                  title="Rephrase and improve text"
                >
                  {rephrasingStates[`problem-${problem.id}-problemDescription`]
                    ? '⏳ Processing...'
                    : '✨ Rephrase'}
                </button>
              </div>
              <textarea
                value={problem.problemDescription}
                onChange={(e) =>
                  handleProblemChange(
                    problem.id,
                    'problemDescription',
                    e.target.value
                  )
                }
                placeholder="Describe the problem, scenario, or assignment requirements..."
                rows={4}
              />
            </div>

            <div className="form-section">
              <div className="textarea-header">
                <label>
                  <h4>Issues Identified</h4>
                  <p className="label-hint">
                    What was wrong? What problems did you encounter?
                  </p>
                </label>
                <button
                  onClick={() =>
                    handleRephrase('problem', problem.id, 'issuesIdentified')
                  }
                  className="rephrase-btn"
                  disabled={
                    !problem.issuesIdentified ||
                    rephrasingStates[`problem-${problem.id}-issuesIdentified`]
                  }
                  title="Rephrase and improve text"
                >
                  {rephrasingStates[`problem-${problem.id}-issuesIdentified`]
                    ? '⏳ Processing...'
                    : '✨ Rephrase'}
                </button>
              </div>
              <textarea
                value={problem.issuesIdentified}
                onChange={(e) =>
                  handleProblemChange(problem.id, 'issuesIdentified', e.target.value)
                }
                placeholder="List the issues, errors, vulnerabilities, or problems you identified..."
                rows={4}
              />
            </div>

            <div className="form-section">
              <div className="textarea-header">
                <label>
                  <h4>Solutions Implemented</h4>
                  <p className="label-hint">
                    How did you solve the problems? What steps did you take?
                  </p>
                </label>
                <button
                  onClick={() =>
                    handleRephrase('problem', problem.id, 'solutionsImplemented')
                  }
                  className="rephrase-btn"
                  disabled={
                    !problem.solutionsImplemented ||
                    rephrasingStates[`problem-${problem.id}-solutionsImplemented`]
                  }
                  title="Rephrase and improve text"
                >
                  {rephrasingStates[`problem-${problem.id}-solutionsImplemented`]
                    ? '⏳ Processing...'
                    : '✨ Rephrase'}
                </button>
              </div>
              <textarea
                value={problem.solutionsImplemented}
                onChange={(e) =>
                  handleProblemChange(
                    problem.id,
                    'solutionsImplemented',
                    e.target.value
                  )
                }
                placeholder="Describe the solutions, fixes, configurations, or steps you implemented..."
                rows={4}
              />
            </div>

            <div className="form-section">
              <label>
                <h4>Images</h4>
                <p className="label-hint">
                  Upload screenshots, diagrams, or photos related to this problem
                </p>
              </label>
              <div className="image-upload-area">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageUpload(problem.id, e)}
                  className="image-input"
                  id={`image-input-${problem.id}`}
                />
                <label
                  htmlFor={`image-input-${problem.id}`}
                  className="image-upload-label"
                >
                  📷 Upload Images
                </label>
              </div>
              {problem.images.length > 0 && (
                <div className="image-preview-grid">
                  {problem.images.map((image, imgIndex) => (
                    <div key={imgIndex} className="image-preview-wrapper">
                      <img
                        src={image}
                        alt={`Problem ${index + 1} - Image ${imgIndex + 1}`}
                        className="image-preview"
                      />
                      <button
                        onClick={() => removeImage(problem.id, imgIndex)}
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
        ))}
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
    </div>
  )
}

export default DocumentEditor
