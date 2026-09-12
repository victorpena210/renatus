# Renatus Technology

Static website for Renatus Technology.

- Website: https://renatus.technology
- GitHub profile: https://github.com/victorpena210
- GitHub repository: https://github.com/victorpena210/renatus

## Client testimonial workflow

Renatus collects testimonials with a Netlify Form at `/testimonials`.

1. A client submits the testimonial form.
2. Review the submission in Netlify under Forms → `testimonial`.
3. Only publish submissions that include publication permission and that you want displayed publicly.
4. Add the approved testimonial to `data/testimonials.json` using this shape:

```json
{
  "testimonials": [
    {
      "name": "Client Name",
      "company": "Company Name",
      "project": "Website Design",
      "rating": 5,
      "testimonial": "Their approved testimonial text.",
      "approved": true
    }
  ]
}
```

Approved entries automatically appear on `/testimonials`. The first three also appear in the homepage client-feedback section. If there are no approved testimonials, the homepage section remains hidden.

Do not add a testimonial to the JSON file unless the client granted publication permission. Email addresses collected by the form are for verification/follow-up only and are never rendered publicly.
