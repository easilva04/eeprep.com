# How to Contribute to EEPrep.com

This guide explains how to contribute to the EEPrep.com project. Whether you're a content creator, developer, designer, or just interested in helping, this document will guide you through the process.

## Repository Information
- **Repository URL**: [github.com/easilva04/eeprep.com](https://github.com/easilva04/eeprep.com)
- **Project Overview**: See our [README.md](/README.md) for project details
- **Task List**: Check our [Todo.md](/Todo.md) for current tasks

## Getting Started

### Prerequisites
- Git installed on your machine
- A GitHub account
- Basic Markdown knowledge (for content)
- HTML/CSS/JavaScript knowledge (for web development)
- Understanding of electrical engineering concepts (for content creation)

### Setting Up Your Local Environment

1. **Fork the Repository**
   - Visit [github.com/easilva04/eeprep.com](https://github.com/easilva04/eeprep.com)
   - Click the "Fork" button in the top-right corner

2. **Clone Your Fork**
   ```
   git clone https://github.com/YOUR-USERNAME/eeprep.com.git
   cd eeprep.com
   ```

3. **Set Up Upstream Remote**
   ```
   git remote add upstream https://github.com/easilva04/eeprep.com.git
   ```

## Development Workflow

### Keeping Your Fork Updated
```
git fetch upstream
git checkout main
git merge upstream/main
```

### Creating a New Feature/Fix
1. **Create a Branch**
   ```
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Update or create content
   - Make code changes
   - Follow our content and code style guidelines

3. **Commit Your Changes**
   ```
   git add .
   git commit -m "Brief description of changes"
   ```

4. **Push Your Branch**
   ```
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**
   - Go to your fork on GitHub
   - Click "New Pull Request"
   - Select your feature branch
   - Add a description of your changes
   - Submit the pull request

## Content Contribution Guidelines

### Using the HTML Template

We use a standardized HTML template for all content pages to ensure consistency across the site.

1. **Locate the Template**
   - Find the template at [template.html](Templates/template.html)
   - Copy this template as your starting point for any new page

2. **Template Structure**
   - The template includes sections for:
     - Topic header and overview
     - Key concepts
     - Examples
     - Related topics
     - Practice problems
     - Additional resources
   
3. **Template Customization**
   - Replace all placeholder text (text in [square brackets])
   - Maintain the HTML structure and class names
   - Add your content within the appropriate sections
   - Update breadcrumbs and navigation links

4. **Testing Your Page**
   - Open the page in a browser to ensure proper rendering
   - Check all links and navigation elements
   - Validate that your content displays correctly

### Managing Content with pages.json

The `pages.json` file serves as our content database and helps maintain site structure.

1. **Locate the File**
   - Find the file at [Topics/pages.json](/Topics/pages.json)

2. **Adding New Content**
   - Use the `quickAdd.newPage` section to add new content
   - Fill in the required fields (title, categoryId, filename, etc.)
   - Follow the examples provided in the file

3. **Content Organization**
   - Review existing categories to determine where your content belongs
   - Use the proper `categoryId` from the available options
   - Set appropriate prerequisites and related pages

### Adding New Content
1. Identify the appropriate section in our content structure
2. Create or edit the Markdown/HTML file in the correct location
3. Follow the established template format
4. Include:
   - Clear explanations of concepts
   - Relevant equations (use LaTeX format)
   - Examples where appropriate
   - Diagrams or images as needed
   - References to source material

### Content Style Guide
- Use clear, concise language
- Define technical terms on first use
- Avoid overly complex explanations
- Break down difficult concepts into manageable parts
- Use headers and lists for organization
- Include examples for abstract concepts

## Code Contribution Guidelines

### HTML/CSS/JavaScript
- Follow responsive design principles
- Comment your code appropriately
- Ensure cross-browser compatibility
- Optimize for performance

### Accessibility Requirements
- Use semantic HTML
- Include alt text for images
- Ensure keyboard navigation works
- Maintain sufficient color contrast

## Review Process
1. A project maintainer will review your pull request
2. Feedback may be provided for revisions
3. Once approved, your contribution will be merged
4. You'll be credited for your contribution

## Additional Resources
- Check our [Todo List](/Todo.md) for prioritized tasks
- Join our contributors' discussion (link TBD)
- Email questions to (project email TBD)

Thank you for contributing to EEPrep.com! Your help is essential in making electrical engineering education more accessible.
