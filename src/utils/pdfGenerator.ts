import jsPDF from 'jspdf'

export interface Problem {
  id: string
  whatCausedProblem: string
  howDidYouFindIt: string
  howDidYouFindItImages: string[]
  whatFixedProblem: string
  howDidYouKnowFixed: string
  howDidYouKnowFixedImages: string[]
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

export const generatePDF = async (data: DocumentData) => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const maxWidth = pageWidth - 2 * margin
  let yPosition = margin

  // Helper function to add text with word wrapping
  const addWrappedText = (
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    fontSize: number = 11,
    isBold: boolean = false,
    lineHeight: number = 7
  ): number => {
    doc.setFontSize(fontSize)
    if (isBold) {
      doc.setFont('helvetica', 'bold')
    } else {
      doc.setFont('helvetica', 'normal')
    }

    const lines = doc.splitTextToSize(text, maxWidth)
    doc.text(lines, x, y)
    return y + lines.length * lineHeight
  }

  // Helper function to check if we need a new page
  const checkNewPage = (requiredSpace: number = 40) => {
    if (yPosition > pageHeight - requiredSpace) {
      doc.addPage()
      yPosition = margin
      return true
    }
    return false
  }

  // Helper function to add image to PDF
  const addImageToPDF = async (imageData: string): Promise<number> => {
    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = imageData

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.warn('Image load timeout')
          resolve(yPosition)
        }, 10000)

        img.onload = () => {
          clearTimeout(timeout)
          try {
            const imgWidth = img.width
            const imgHeight = img.height
            
            if (imgWidth === 0 || imgHeight === 0) {
              console.warn('Invalid image dimensions')
              resolve(yPosition)
              return
            }

            const ratio = imgWidth / imgHeight

            // Calculate dimensions to fit within page width
            let displayWidth = maxWidth
            let displayHeight = displayWidth / ratio

            // If image is too tall, scale it down
            if (displayHeight > pageHeight - yPosition - 30) {
              displayHeight = pageHeight - yPosition - 30
              displayWidth = displayHeight * ratio
            }

            checkNewPage(displayHeight + 20)

            // Center the image
            const xPosition = (pageWidth - displayWidth) / 2

            // Detect image format from data URL
            let imageFormat = 'JPEG' // default
            if (imageData.startsWith('data:image/')) {
              const formatMatch = imageData.match(/data:image\/([^;]+)/)
              if (formatMatch) {
                const format = formatMatch[1].toUpperCase()
                if (format === 'PNG') {
                  imageFormat = 'PNG'
                } else if (format === 'JPEG' || format === 'JPG') {
                  imageFormat = 'JPEG'
                } else {
                  imageFormat = 'JPEG' // fallback
                }
              }
            }

            // Convert WEBP or other formats to JPEG if needed
            let finalImageData = imageData
            if (imageData.includes('webp') || imageData.includes('WEBP')) {
              try {
                const canvas = document.createElement('canvas')
                canvas.width = imgWidth
                canvas.height = imgHeight
                const ctx = canvas.getContext('2d')
                if (ctx) {
                  ctx.drawImage(img, 0, 0)
                  finalImageData = canvas.toDataURL('image/jpeg', 0.95)
                  imageFormat = 'JPEG'
                }
              } catch (e) {
                console.warn('Could not convert image, using original:', e)
              }
            }

            doc.addImage(
              finalImageData,
              imageFormat,
              xPosition,
              yPosition,
              displayWidth,
              displayHeight
            )

            yPosition += displayHeight + 10
            resolve(yPosition)
          } catch (error) {
            console.error('Error adding image to PDF:', error)
            resolve(yPosition)
          }
        }

        img.onerror = (error) => {
          clearTimeout(timeout)
          console.error('Error loading image for PDF:', error)
          resolve(yPosition)
        }
      })
    } catch (error) {
      console.error('Error adding image to PDF:', error)
      return yPosition
    }
  }

  // Header
  doc.setFillColor(102, 126, 234)
  doc.rect(0, 0, pageWidth, 50, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Assignment Documentation', margin, 25)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(data.courseName || 'Academic Assignment', margin, 35)

  yPosition = 60

  // Reset text color
  doc.setTextColor(0, 0, 0)

  // Assignment Information Section
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(102, 126, 234)
  doc.text('Assignment Information', margin, yPosition)
  yPosition += 10

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)

  const infoItems = [
    { label: 'Assignment Title:', value: data.assignmentTitle || 'N/A' },
    { label: 'Course Name:', value: data.courseName || 'N/A' },
    { label: 'Student Name:', value: data.studentName || 'N/A' },
    { label: 'Date:', value: data.date || 'N/A' },
  ]

  infoItems.forEach((item) => {
    doc.setFont('helvetica', 'bold')
    doc.text(item.label, margin, yPosition)
    doc.setFont('helvetica', 'normal')
    const labelWidth = doc.getTextWidth(item.label)
    doc.text(item.value, margin + labelWidth + 5, yPosition)
    yPosition += 8
  })

  yPosition += 10

  // Problems Section
  if (data.problems && data.problems.length > 0) {
    for (let index = 0; index < data.problems.length; index++) {
      const problem = data.problems[index]
      checkNewPage(50)

      // Problem Header
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(102, 126, 234)
      yPosition = addWrappedText(
        `Problem ${index + 1}`,
        margin,
        yPosition,
        maxWidth,
        16,
        true,
        10
      )
      yPosition += 5

      // 1. What Caused the Problem?
      if (problem.whatCausedProblem) {
        checkNewPage(40)
        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(102, 126, 234)
        yPosition = addWrappedText(
          '1. What Caused the Problem?',
          margin,
          yPosition,
          maxWidth,
          13,
          true,
          8
        )
        yPosition += 3

        doc.setFontSize(11)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        yPosition = addWrappedText(
          problem.whatCausedProblem,
          margin,
          yPosition,
          maxWidth,
          11,
          false,
          6
        )
        yPosition += 10
      }

      // 2. How Did You Find It?
      if (problem.howDidYouFindIt) {
        checkNewPage(40)
        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(102, 126, 234)
        yPosition = addWrappedText(
          '2. How Did You Find the Problem?',
          margin,
          yPosition,
          maxWidth,
          13,
          true,
          8
        )
        yPosition += 3

        doc.setFontSize(11)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        yPosition = addWrappedText(
          problem.howDidYouFindIt,
          margin,
          yPosition,
          maxWidth,
          11,
          false,
          6
        )
        yPosition += 10
      }

      // 3. What Fixed the Problem?
      if (problem.whatFixedProblem) {
        checkNewPage(40)
        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(102, 126, 234)
        yPosition = addWrappedText(
          '3. What Fixed the Problem?',
          margin,
          yPosition,
          maxWidth,
          13,
          true,
          8
        )
        yPosition += 3

        doc.setFontSize(11)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        yPosition = addWrappedText(
          problem.whatFixedProblem,
          margin,
          yPosition,
          maxWidth,
          11,
          false,
          6
        )
        yPosition += 10
      }

      // 4. How Did You Know It Was Fixed?
      if (problem.howDidYouKnowFixed) {
        checkNewPage(40)
        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(102, 126, 234)
        yPosition = addWrappedText(
          '4. How Did You Know the Problem Was Fixed?',
          margin,
          yPosition,
          maxWidth,
          13,
          true,
          8
        )
        yPosition += 3

        doc.setFontSize(11)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        yPosition = addWrappedText(
          problem.howDidYouKnowFixed,
          margin,
          yPosition,
          maxWidth,
          11,
          false,
          6
        )
        yPosition += 10

        // Images for "How Did You Know It Was Fixed"
        if (problem.howDidYouKnowFixedImages && problem.howDidYouKnowFixedImages.length > 0) {
          checkNewPage(50)
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(102, 126, 234)
          yPosition = addWrappedText(
            'Verification Evidence',
            margin,
            yPosition,
            maxWidth,
            12,
            true,
            8
          )
          yPosition += 5

          for (const image of problem.howDidYouKnowFixedImages) {
            yPosition = await addImageToPDF(image)
          }
          yPosition += 5
        }
      }

      // Images
      if (problem.images && problem.images.length > 0) {
        checkNewPage(50)
        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(102, 126, 234)
        yPosition = addWrappedText(
          'Related Images',
          margin,
          yPosition,
          maxWidth,
          13,
          true,
          8
        )
        yPosition += 5

        // Add each image
        for (const image of problem.images) {
          yPosition = await addImageToPDF(image)
        }
        yPosition += 5
      }

      // Add spacing between problems
      if (index < data.problems.length - 1) {
        yPosition += 10
        doc.setLineWidth(0.5)
        doc.setDrawColor(200, 200, 200)
        doc.line(margin, yPosition, pageWidth - margin, yPosition)
        yPosition += 15
      }
    }
  }

  // Additional Notes
  if (data.additionalNotes) {
    checkNewPage(40)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(102, 126, 234)
    yPosition = addWrappedText(
      'Additional Notes',
      margin,
      yPosition,
      maxWidth,
      14,
      true,
      8
    )
    yPosition += 3

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    yPosition = addWrappedText(
      data.additionalNotes,
      margin,
      yPosition,
      maxWidth,
      11,
      false,
      6
    )
  }

  // Footer on each page
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(10)
    doc.setTextColor(128, 128, 128)
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )
  }

  // Generate filename
  const filename = `${data.assignmentTitle || 'Assignment'}_${data.studentName || 'Document'}_${data.date || new Date().toISOString().split('T')[0]}.pdf`
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase()

  // Save the PDF
  doc.save(filename)
}

export const generatePDFBlob = async (data: DocumentData): Promise<Blob> => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const maxWidth = pageWidth - 2 * margin
  let yPosition = margin

  // Helper function to add text with word wrapping
  const addWrappedText = (
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    fontSize: number = 11,
    isBold: boolean = false,
    lineHeight: number = 7
  ): number => {
    doc.setFontSize(fontSize)
    if (isBold) {
      doc.setFont('helvetica', 'bold')
    } else {
      doc.setFont('helvetica', 'normal')
    }

    const lines = doc.splitTextToSize(text, maxWidth)
    doc.text(lines, x, y)
    return y + lines.length * lineHeight
  }

  // Helper function to check if we need a new page
  const checkNewPage = (requiredSpace: number = 40) => {
    if (yPosition > pageHeight - requiredSpace) {
      doc.addPage()
      yPosition = margin
      return true
    }
    return false
  }

  // Helper function to add image to PDF
  const addImageToPDF = async (imageData: string): Promise<number> => {
    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = imageData

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.warn('Image load timeout')
          resolve(yPosition)
        }, 10000)

        img.onload = () => {
          clearTimeout(timeout)
          try {
            const imgWidth = img.width
            const imgHeight = img.height
            
            if (imgWidth === 0 || imgHeight === 0) {
              console.warn('Invalid image dimensions')
              resolve(yPosition)
              return
            }

            const ratio = imgWidth / imgHeight

            // Calculate dimensions to fit within page width
            let displayWidth = maxWidth
            let displayHeight = displayWidth / ratio

            // If image is too tall, scale it down
            if (displayHeight > pageHeight - yPosition - 30) {
              displayHeight = pageHeight - yPosition - 30
              displayWidth = displayHeight * ratio
            }

            checkNewPage(displayHeight + 20)

            // Center the image
            const xPosition = (pageWidth - displayWidth) / 2

            // Detect image format from data URL
            let imageFormat = 'JPEG' // default
            if (imageData.startsWith('data:image/')) {
              const formatMatch = imageData.match(/data:image\/([^;]+)/)
              if (formatMatch) {
                const format = formatMatch[1].toUpperCase()
                if (format === 'PNG') {
                  imageFormat = 'PNG'
                } else if (format === 'JPEG' || format === 'JPG') {
                  imageFormat = 'JPEG'
                } else {
                  imageFormat = 'JPEG' // fallback
                }
              }
            }

            // Convert WEBP or other formats to JPEG if needed
            let finalImageData = imageData
            if (imageData.includes('webp') || imageData.includes('WEBP')) {
              try {
                const canvas = document.createElement('canvas')
                canvas.width = imgWidth
                canvas.height = imgHeight
                const ctx = canvas.getContext('2d')
                if (ctx) {
                  ctx.drawImage(img, 0, 0)
                  finalImageData = canvas.toDataURL('image/jpeg', 0.95)
                  imageFormat = 'JPEG'
                }
              } catch (e) {
                console.warn('Could not convert image, using original:', e)
              }
            }

            doc.addImage(
              finalImageData,
              imageFormat,
              xPosition,
              yPosition,
              displayWidth,
              displayHeight
            )

            yPosition += displayHeight + 10
            resolve(yPosition)
          } catch (error) {
            console.error('Error adding image to PDF:', error)
            resolve(yPosition)
          }
        }

        img.onerror = (error) => {
          clearTimeout(timeout)
          console.error('Error loading image for PDF:', error)
          resolve(yPosition)
        }
      })
    } catch (error) {
      console.error('Error adding image to PDF:', error)
      return yPosition
    }
  }

  // Header
  doc.setFillColor(102, 126, 234)
  doc.rect(0, 0, pageWidth, 50, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Assignment Documentation', margin, 25)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(data.courseName || 'Academic Assignment', margin, 35)

  yPosition = 60

  // Reset text color
  doc.setTextColor(0, 0, 0)

  // Assignment Information Section
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(102, 126, 234)
  doc.text('Assignment Information', margin, yPosition)
  yPosition += 10

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)

  const infoItems = [
    { label: 'Assignment Title:', value: data.assignmentTitle || 'N/A' },
    { label: 'Course Name:', value: data.courseName || 'N/A' },
    { label: 'Student Name:', value: data.studentName || 'N/A' },
    { label: 'Date:', value: data.date || 'N/A' },
  ]

  infoItems.forEach((item) => {
    doc.setFont('helvetica', 'bold')
    doc.text(item.label, margin, yPosition)
    doc.setFont('helvetica', 'normal')
    const labelWidth = doc.getTextWidth(item.label)
    doc.text(item.value, margin + labelWidth + 5, yPosition)
    yPosition += 8
  })

  yPosition += 10

  // Problems Section
  if (data.problems && data.problems.length > 0) {
    for (let index = 0; index < data.problems.length; index++) {
      const problem = data.problems[index]
      checkNewPage(50)

      // Problem Header
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(102, 126, 234)
      yPosition = addWrappedText(
        `Problem ${index + 1}`,
        margin,
        yPosition,
        maxWidth,
        16,
        true,
        10
      )
      yPosition += 5

      // 1. What Caused the Problem?
      if (problem.whatCausedProblem) {
        checkNewPage(40)
        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(102, 126, 234)
        yPosition = addWrappedText(
          '1. What Caused the Problem?',
          margin,
          yPosition,
          maxWidth,
          13,
          true,
          8
        )
        yPosition += 3

        doc.setFontSize(11)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        yPosition = addWrappedText(
          problem.whatCausedProblem,
          margin,
          yPosition,
          maxWidth,
          11,
          false,
          6
        )
        yPosition += 10
      }

      // 2. How Did You Find It?
      if (problem.howDidYouFindIt) {
        checkNewPage(40)
        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(102, 126, 234)
        yPosition = addWrappedText(
          '2. How Did You Find the Problem?',
          margin,
          yPosition,
          maxWidth,
          13,
          true,
          8
        )
        yPosition += 3

        doc.setFontSize(11)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        yPosition = addWrappedText(
          problem.howDidYouFindIt,
          margin,
          yPosition,
          maxWidth,
          11,
          false,
          6
        )
        yPosition += 10

        // Images for "How Did You Find It"
        if (problem.howDidYouFindItImages && problem.howDidYouFindItImages.length > 0) {
          checkNewPage(50)
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(102, 126, 234)
          yPosition = addWrappedText(
            'Investigation Evidence',
            margin,
            yPosition,
            maxWidth,
            12,
            true,
            8
          )
          yPosition += 5

          for (const image of problem.howDidYouFindItImages) {
            yPosition = await addImageToPDF(image)
          }
          yPosition += 5
        }
      }

      // 3. What Fixed the Problem?
      if (problem.whatFixedProblem) {
        checkNewPage(40)
        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(102, 126, 234)
        yPosition = addWrappedText(
          '3. What Fixed the Problem?',
          margin,
          yPosition,
          maxWidth,
          13,
          true,
          8
        )
        yPosition += 3

        doc.setFontSize(11)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        yPosition = addWrappedText(
          problem.whatFixedProblem,
          margin,
          yPosition,
          maxWidth,
          11,
          false,
          6
        )
        yPosition += 10
      }

      // 4. How Did You Know It Was Fixed?
      if (problem.howDidYouKnowFixed) {
        checkNewPage(40)
        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(102, 126, 234)
        yPosition = addWrappedText(
          '4. How Did You Know the Problem Was Fixed?',
          margin,
          yPosition,
          maxWidth,
          13,
          true,
          8
        )
        yPosition += 3

        doc.setFontSize(11)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        yPosition = addWrappedText(
          problem.howDidYouKnowFixed,
          margin,
          yPosition,
          maxWidth,
          11,
          false,
          6
        )
        yPosition += 10

        // Images for "How Did You Know It Was Fixed"
        if (problem.howDidYouKnowFixedImages && problem.howDidYouKnowFixedImages.length > 0) {
          checkNewPage(50)
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(102, 126, 234)
          yPosition = addWrappedText(
            'Verification Evidence',
            margin,
            yPosition,
            maxWidth,
            12,
            true,
            8
          )
          yPosition += 5

          for (const image of problem.howDidYouKnowFixedImages) {
            yPosition = await addImageToPDF(image)
          }
          yPosition += 5
        }
      }

      // Images
      if (problem.images && problem.images.length > 0) {
        checkNewPage(50)
        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(102, 126, 234)
        yPosition = addWrappedText(
          'Related Images',
          margin,
          yPosition,
          maxWidth,
          13,
          true,
          8
        )
        yPosition += 5

        // Add each image
        for (const image of problem.images) {
          yPosition = await addImageToPDF(image)
        }
        yPosition += 5
      }

      // Add spacing between problems
      if (index < data.problems.length - 1) {
        yPosition += 10
        doc.setLineWidth(0.5)
        doc.setDrawColor(200, 200, 200)
        doc.line(margin, yPosition, pageWidth - margin, yPosition)
        yPosition += 15
      }
    }
  }

  // Additional Notes
  if (data.additionalNotes) {
    checkNewPage(40)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(102, 126, 234)
    yPosition = addWrappedText(
      'Additional Notes',
      margin,
      yPosition,
      maxWidth,
      14,
      true,
      8
    )
    yPosition += 3

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    yPosition = addWrappedText(
      data.additionalNotes,
      margin,
      yPosition,
      maxWidth,
      11,
      false,
      6
    )
  }

  // Footer on each page
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(10)
    doc.setTextColor(128, 128, 128)
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )
  }

  // Return PDF as blob
  return doc.output('blob')
}
