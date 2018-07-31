# I just.... whatever, just avert your eyes.
import warnings
warnings.filterwarnings("ignore", message="numpy.dtype size changed")
warnings.filterwarnings("ignore", message="numpy.ufunc size changed")

import spacy

nlp = spacy.load('en')

train_data = [
    (u'''- Design, develop, and maintain software applications and operating systems for a variety of engineering applications in Visual Basic 6.0, COM, COM+, C/C++, C#, .NET, and XML;

- Develop and enhance software tools, simulators, and interfaces; 

- Design, develop, and test software applications and operating systems-level software, compilers, and network distribution software applications;

- Define, document, analyze, perform, and interpret developmental tests for new and/or modified products or product components;

- Investigate and resolve operational problems in conjunction with other engineering and technical personnel;

- Use UML modeling tools to perform software code evaluations; and

- Create or modify existing documentation supporting software design, software implementation, test plans, test reports and user documentation''', {"cats": {"SOFTWARE": 0}}),
    (u'''Primary Responsibilities:  Provide software engineering support to integrate analytics into corporate systems and visualization tools; design, develop, modify, code, test, debug, enhance, document and maintain software applications and processes. Provide software development plans then include concepts, objectives, and requirements to be satisfied and procedures to be used during the system development to include timeline, logistics/support requirements, testing, and documentation.''', {"cats": {"SOFTWARE": 1}}),
    (u'''Design and develop new software by applying techniques of computer science, engineering, and mathematical analysis that satisfies the objectives stated in the business requirements
Evaluate and select process and logic patterns, programming language constructs, data storage methods, and operating environment interfaces that effectively satisfy business requirements and quantifiable measures
Develop appropriate programs and systems documentation according to established department standards
Collaborate with architects, systems engineers, project managers, systems administrators, and operations analysts to deploy and implement solutions, and troubleshoot technical issues
Lead the development team in the deployment/implementation of software solutions''', {"cats": {"SOFTWARE": 1}}),
    (u'''The ideal candidate for the Manager of Hospital Finance should have extensive knowledge with healthcare accounting principles and patient accounting/billing, including knowledge of Medicare, Medicaid and third-party payers. The Manager of Hospital Finance will report to Director of Finance and work closely with this person to make recommendations for strategy, policy and procedure and human resource issues. ''', {"cats": {"SOFTWARE": 0}}),
    (u'''As an Unit Manager - RN, you will oversee the care management of a population of patients within a designated unit. The position conducts the nursing process – assessment, planning, implementation and evaluation – under the scope of the State's Nurse Practice Act of Registered Nurse licensure. The Unit Manager - RN coordinates resource utilization, timely and appropriate care interventions, and interdisciplinary communication to enhance patient and family satisfaction, adherence to center's clinical systems and regulatory compliance.''', {"cats": {"SOFTWARE": 0}}),
    (u'''Leadership is an intangible quality, not easily defined. And yet your patients and staff recognize it in your patience, confidence, skill and compassion. Your positive impact, excellent clinical skills, experience, and natural talents have prepared you to step into a nurse leadership role at HCR ManorCare.
As an Unit Manager - RN, you will oversee the care management of a population of patients within an assigned area, unit or clinical function. The position conducts the nursing process, assessment, planning, implementation, and evaluation under the scope of the State's Nurse Practice Act of Registered Nurse licensure. The Unit Manager - RN coordinates resource utilization, timely and appropriate care interventions, and interdisciplinary communication to enhance patient and family satisfaction, adherence to center's clinical systems and regulatory compliance.''', {"cats": {"SOFTWARE": 0}}),
]


textcat = nlp.create_pipe('textcat')
nlp.add_pipe(textcat, last=True)
textcat.add_label('SOFTWARE')
optimizer = nlp.begin_training(use_gpu = True)
for itn in range(100):
    for doc, gold in train_data:
        nlp.update([doc], [gold], sgd=optimizer)

doc = nlp(u'''This role is in the Enterprise Platforms – AID (Automation, Integration & Development) team, which is responsible for supporting integration needs for various Enterprise platforms. The role enables integration of enterprise systems and business processes using open source frameworks and COTS products.

The Senior Associate Software Engineer plays an integral role in building a holistic view and roadmap of the company’s information technology strategy and processes. The Senior Associate Software Engineer partners with both business and technology groups to ensure that the proposed technical solutions align with the company’s overall objectives, and that both groups enable and drive each other to meet the company’s mission and vision.''')
print(doc.cats)